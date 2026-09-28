#!/usr/bin/env node
/**
 * 构建**浏览器侧产物**到 `dist/web`，供 `serve-app.mjs` + `verify.py --target app` 使用。
 *
 * 为什么不用 `rsbuild build` 一条命令搞定 —— 本机有两道独立的坎，得同时绕过：
 *
 *   ① **产物不落盘**。rsbuild 由原生（Rust）代码写输出文件，本机环境下这些写入被
 *      静默吞掉：命令报 `ready built` 并逐条列出产物，`dist/` 却整个不存在。
 *      排查过：非 cleanDistPath、非权限/磁盘、非配置问题。（Node 自己 `fs.writeFile`
 *      是正常的 —— 所以绕法是构建后从 `stats.compilation.assets` 手动写盘。）
 *
 *   ② **程序化调用拿不到配置里的 plugins**。`createRsbuild({ cwd })` 会读到
 *      `dev` / `server` / `html` / `output` 这些键，**但 `plugins` 是空的**：于是
 *      pluginReact 不生效（swc 退回 classic runtime，产物里全是 `React.createElement`
 *      而源码没有 `import React` → 浏览器 `ReferenceError: React is not defined`），
 *      pluginSvgr 也不生效（`.svg` 落回 `svg-asset`，`ReactComponent` 具名导出不存在）。
 *      实测报错：
 *        × ESModulesLinkingError: Can't import the named export 'ReactComponent'
 *          (imported as 'ErrorIllustration') from default-exporting module
 *          File: ./src/components/error-fallback/index.tsx
 *      CLI 没有这个问题 —— 因为它显式 `loadConfig()` 后再把结果交给 createRsbuild。
 *      这里照抄 CLI 的做法，于是 ① 的手动落盘和 ② 的插件加载可以同时满足。
 *
 * 只构建 web：`BIU_WEB_ONLY=1` 会让 `plugins/rsbuild-plugin-electron.ts` 跳过 Electron
 * 主进程打包与 electron-builder 封装（后者还要 Xcode 的 actool，本机没有）。
 *
 * 用法：
 *   node tools/design-fidelity/build-app.mjs [输出目录，默认 dist/web]
 *
 * 产物用途：`node tools/design-fidelity/serve-app.mjs`（4173）+
 * `bash tools/design-fidelity/run.sh --screen 07 --target app --base-url http://127.0.0.1:4173`。
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, "dist/web"));

process.env.BIU_WEB_ONLY = "1";

const { createRsbuild, loadConfig } = await import("@rsbuild/core");

// 关键：显式 loadConfig。只给 `cwd` 的话 plugins 拿不到（见文件头 ②）。
const { content: rsbuildConfig, filePath } = await loadConfig({ cwd: ROOT });
const pluginNames = (rsbuildConfig.plugins ?? []).map(p => p?.name).filter(Boolean);
console.log(`▸ 配置 ${path.relative(ROOT, filePath)}，插件 ${pluginNames.length} 个：${pluginNames.join(", ")}`);

const rsbuild = await createRsbuild({ cwd: ROOT, rsbuildConfig });

/**
 * 落盘点选在 `onAfterBuild`：此时 compilation 已完成、assets 全在内存里，
 * 而 rsbuild 自己的写盘动作已经（在本机上无声地）失败过了 —— 我们补上那一步。
 *
 * `source.source()` 对文本产物返回 string、对二进制返回 Buffer，
 * `writeFile` 两者都收，所以不必按类型分支。
 */
let landed = 0;
let runtimeModules = 0;
rsbuild.onAfterBuild(async ({ stats }) => {
  const assets = stats.compilation.assets;
  const names = Object.keys(assets);

  for (const name of names) {
    const target = path.join(OUT, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, assets[name].source());
  }

  landed = names.length;

  // automatic runtime 的直接证据：模块图里存在 react/jsx-runtime。
  // 不能改去产物文本里找这个字符串 —— 生产压缩把模块 id 变成了数字，文本里搜不到。
  for (const m of stats.compilation.modules) {
    if (/react[/\\]jsx-runtime/.test(m.resource ?? "")) runtimeModules++;
  }

  console.log(`\n▸ 手动落盘 ${landed} 个产物 → ${OUT}`);
});

const result = await rsbuild.build();
if (result.stats.hasErrors()) {
  console.error(result.stats.toString({ preset: "errors-warnings", errors: true }));
  process.exitCode = 1;
  process.exit();
}

// ── 自检：产物齐、runtime 对 ────────────────────────────────────────────────
const walk = async dir => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
};

const files = await walk(OUT);
const jsFiles = files.filter(f => f.endsWith(".js"));
let classic = 0;
for (const file of jsFiles) {
  const text = await readFile(file, "utf8");
  // classic runtime 的标记是自由变量 `React.createElement`。源码里没有 `import React`，
  // 所以它一旦出现就是运行时必崩的信号（浏览器里 `React is not defined`、整页空白）。
  classic += text.split("React.createElement").length - 1;
}

const hasIndex = files.some(f => f.endsWith(`${path.sep}index.html`));
console.log(`▸ 自检：落盘 ${files.length} 个文件（compilation 报了 ${landed} 个），index.html ${hasIndex ? "✓" : "✗"}`);
console.log(`  React.createElement = ${classic}（应为 0），react/jsx-runtime 模块 = ${runtimeModules}（应 ≥ 1）`);
if (!hasIndex || classic > 0 || runtimeModules === 0) {
  console.error("✗ 产物不合格 —— 比对会拿到空白页。");
  process.exitCode = 1;
}
