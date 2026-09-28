#!/usr/bin/env node
/**
 * 量**真实 DOM 几何**（CDP），用于 PNG 带分析定不了位的时候。
 *
 * 为什么需要它 —— 本轮（1.3.20）屏 07 的实例：
 *   PNG 带分析能告诉我们「大卡正文列比设计低 5.4px」，但**不能**告诉我们
 *   「为什么低」：是卡片内边距错了？是某一层的 margin 错了？还是居中算错了？
 *   这些量在截图上都是同样的「一片位移」。用 CDP 读一次 bounding rect 就闭合了：
 *   正文列高 148.5、内容盒高 200.25 ⇒ 居中偏移 25.875 + 包装层行盒上承载 1.5
 *   = 27.375，与实测 382.33 − 354.95 = 27.38 逐值一致 —— 于是「居中没错，错的是
 *   设计稿的正文列更高」这个判断才有依据，而不是靠猜。
 *
 * 也用来验证**不可见**的盒子：`getBoundingClientRect` 看得见每个包装层的高度，
 * 而其中一些（行盒上承载、`min-height` 的派生）在稿面上根本没有对应物。
 *
 * 用法：
 *   node tools/design-fidelity/measure-dom.mjs <url> <选择器> [选择器 ...]
 *   node tools/design-fidelity/measure-dom.mjs \
 *     'http://127.0.0.1:4173/#/?fixture=07-discover-card' 'article' 'article h3'
 *
 * 输出：每个选择器的 bounding rect（t/b/l/rr/w/h，1 位小数）+ 常见排版属性
 * （font-size / line-height / margin / padding / display），JSON 形状、逐行打印。
 *
 * 前置：目标已可访问（`serve-app.mjs` + `build-app.mjs` 产出，或任意 dev server）。
 * Chrome 用 `--headless=new --no-sandbox`（理由同 verify.py：受限环境里沙箱初始化
 * 不了会让 GPU 进程 FATAL，一张图都拿不到；沙箱是进程隔离，与渲染无关）。
 *
 * 与 verify.py 的分工：**verify.py 判「像不像」，本脚本答「为什么」**。
 * 它不参与 PASS/FAIL —— 闸门永远只认像素。
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const VIEWPORT = { width: 1440, height: 900 };
const PORT = Number(process.env.BIU_CDP_PORT ?? 9333);
const WAIT_MS = Number(process.env.BIU_CDP_WAIT_MS ?? 2500);

const [url, ...selectors] = process.argv.slice(2);
if (!url || selectors.length === 0) {
  const here = path.relative(process.cwd(), fileURLToPath(import.meta.url));
  console.error(`用法：node ${here} <url> <选择器> [选择器 ...]`);
  process.exit(2);
}

const chrome = CHROME_CANDIDATES.find(candidate => existsSync(candidate));
if (!chrome) {
  console.error("未找到 Chrome / Chromium，无法量 DOM。");
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const child = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(process.env.TMPDIR ?? "/tmp", `biu-cdp-${PORT}`)}`,
    url,
  ],
  { stdio: "ignore" },
);

/** CDP 的 page target 只在自己起来之后才出现，故轮询而不是 sleep 一个定值。 */
const findTarget = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(500);
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await response.json();
      const page = list.find(item => item.type === "page" && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      // 浏览器还没监听，继续等。
    }
  }
  return null;
};

const EXPRESSION = `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const rectOf = (element) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return {
      top: round(box.top), bottom: round(box.bottom),
      left: round(box.left), right: round(box.right),
      width: round(box.width), height: round(box.height),
    };
  };
  const styleOf = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const keys = [
      "display", "fontSize", "lineHeight", "letterSpacing", "fontWeight",
      "marginTop", "marginBottom", "paddingTop", "paddingBottom",
      "borderTopWidth", "alignItems", "rowGap",
    ];
    const picked = {};
    for (const key of keys) picked[key] = style[key];
    return picked;
  };
  const report = {};
  for (const selector of ${JSON.stringify(selectors)}) {
    report[selector] = Array.from(document.querySelectorAll(selector)).map((element) => ({
      rect: rectOf(element),
      style: styleOf(element),
      text: (element.textContent ?? "").trim().slice(0, 40),
    }));
  }
  return { viewport: { innerWidth, innerHeight, dpr: devicePixelRatio }, report };
})()`;

const target = await findTarget();
if (!target) {
  child.kill("SIGKILL");
  console.error("没拿到 CDP page target —— 检查端口是否被占用、URL 是否可访问。");
  process.exit(1);
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => {
  socket.onopen = resolve;
});

let messageId = 0;
const pending = new Map();
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (resolve) {
    pending.delete(message.id);
    resolve(message);
  }
};
const send = (method, params = {}) =>
  new Promise(resolve => {
    messageId += 1;
    pending.set(messageId, resolve);
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });

await send("Runtime.enable");
await sleep(WAIT_MS);

const outcome = await send("Runtime.evaluate", { expression: EXPRESSION, returnByValue: true });
const value = outcome.result?.result?.value;
if (!value) {
  console.error("页面里没有拿到结果：", JSON.stringify(outcome.result ?? outcome));
} else {
  console.log(JSON.stringify(value, null, 2));
}

socket.close();
child.kill("SIGKILL");
process.exit(value ? 0 : 1);
