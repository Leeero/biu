#!/usr/bin/env node
/**
 * DOM 几何探针 —— 通过 Chrome DevTools Protocol 读取应用真实布局。
 *
 * 用法：
 *   node tools/design-fidelity/dom-probe.mjs <url> [expr.mjs]
 *
 * 为什么需要它：`verify.py` 只能做像素取证，「差 5px」这类问题要区分
 * 「行整体下移」还是「行内对齐偏移」，读一次 `getBoundingClientRect()` 比
 * 猜十次阈值都准。像素给出症状，DOM 给出病因。
 *
 * 依赖：Node 22 的内建 WebSocket（无需 npm 包）。
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const findChrome = () => {
  const hit = CHROME_CANDIDATES.find(p => existsSync(p));
  if (!hit) {
    console.error("未找到 Chrome / Chromium");
    process.exit(1);
  }
  return hit;
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const url = process.argv[2];
const exprFile = process.argv[3];
if (!url) {
  console.error("用法：node tools/design-fidelity/dom-probe.mjs <url> [expr.mjs]");
  process.exit(2);
}

const DEFAULT_EXPR = String.raw`
(() => {
  const rect = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  // 滚动容器内的一级结构：页头 / 分组 / 表格
  const scroller = document.querySelector('main') || document.body;
  const out = { viewport: { w: innerWidth, h: innerHeight }, main: rect(scroller), nodes: [] };
  const walk = (el, depth) => {
    if (depth > 6) return;
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { walk(c, depth + 1); continue; }
      const cs = getComputedStyle(c);
      out.nodes.push({
        depth,
        tag: c.tagName.toLowerCase(),
        cls: (c.className || '').toString().slice(0, 90),
        text: (c.textContent || '').trim().slice(0, 28),
        ...rect(c),
        marginBottom: cs.marginBottom,
        paddingTop: cs.paddingTop,
        lineHeight: cs.lineHeight,
        fontSize: cs.fontSize,
        alignItems: cs.alignItems,
      });
      walk(c, depth + 1);
    }
  };
  walk(scroller, 0);
  return JSON.stringify(out);
})()
`;

const expr = exprFile ? readFileSync(exprFile, "utf8") : DEFAULT_EXPR;

const chrome = findChrome();
const port = 9333 + Math.floor(Math.random() * 200);

const child = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1440,900",
  `--remote-debugging-port=${port}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--user-data-dir=/tmp/biu-domprobe-profile",
  "about:blank",
]);
child.on("error", e => {
  console.error("启动 Chrome 失败：", e.message);
  process.exit(1);
});

const cleanup = () => {
  try {
    child.kill("SIGKILL");
  } catch {}
};
process.on("exit", cleanup);

// 1. 等待调试端口就绪
let version = null;
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (res.ok) {
      version = await res.json();
      break;
    }
  } catch {}
  await sleep(250);
}
if (!version) {
  console.error("Chrome 调试端口未就绪");
  cleanup();
  process.exit(1);
}

// 2. 开一个新标签页到目标 URL
const newTab = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
const tab = await newTab.json();
const wsUrl = tab.webSocketDebuggerUrl;

// 3. 用内建 WebSocket 发 CDP 命令
const ws = new WebSocket(wsUrl);
let msgId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const events = [];
ws.addEventListener("message", ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  } else if (msg.method) {
    events.push(msg.method);
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

await send("Page.enable");
await send("Runtime.enable");

// 等首屏渲染 + 夹具数据注入
await sleep(3500);

const result = await send("Runtime.evaluate", {
  expression: expr,
  returnByValue: true,
  awaitPromise: true,
});

if (result.exceptionDetails) {
  console.error("求值异常：", JSON.stringify(result.exceptionDetails, null, 2));
} else {
  const value = result.result.value;
  if (typeof value === "string") {
    try {
      console.log(JSON.stringify(JSON.parse(value), null, 2));
    } catch {
      console.log(value);
    }
  } else {
    console.log(JSON.stringify(value, null, 2));
  }
}

ws.close();
cleanup();
process.exit(0);
