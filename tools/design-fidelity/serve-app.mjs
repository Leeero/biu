#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
/**
 * 静态服务：把 `dist/web` 的构建产物以 SPA 方式伺服给 verify.py。
 *
 * 为什么不用 rsbuild dev：dev server 常驻、内存占用大，在保真度比对的
 * 场景里只需要「URL → HTML → JS 可跑」。构建产物 + 一个 60 行的静态
 * 服务更稳定，且比对目标就是发布形态的产物，不是 dev 变换后的代码。
 *
 * SPA fallback：/library、/collection/1 等路由在产物里没有对应文件，
 * 一律回落 index.html，由 react-router 在客户端接管 —— 这正是
 * `verify.py --target app --base-url http://127.0.0.1:<port>` 需要的。
 *
 * 用法：node tools/design-fidelity/serve-app.mjs [--root dist/web] [--port 4173]
 */
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const ROOT = resolve(argOf("--root", "dist/web"));
const PORT = Number(argOf("--port", "4173"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    // 防目录穿越：normalize 后必须仍在 ROOT 内。
    const candidate = normalize(join(ROOT, pathname));
    if (!candidate.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }

    let filePath = candidate;
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) filePath = join(candidate, "index.html");
    } catch {
      // 产物里没有的路径一律回落 SPA 入口（含 /library 这类带下划线路由的深链）。
      filePath = join(ROOT, "index.html");
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}`);
});
