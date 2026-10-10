/**
 * 渲染层 CSP ↔ 第三方脚本地址的同步契约。
 *
 * 为什么单独立一个文件：这类缺陷**不会**让构建、lint 或其它单测变红 ——
 * CSP 是运行时的浏览器策略，写窄了只有真的去点那条路径才看得见。
 * 2026-10-10 的实例：`src/index.html` 的 `script-src 'self'` 把极验的 `gt.js`
 * 拦在门外，登录弹窗里的短信 / 密码登录一路报「加载风控验证码出错」
 * （扫码登录不走极验，所以看上去「只是登录坏了」）。当时没有任何检查会报它。
 *
 * 这里把两件事钉在一起：
 *   1. `src/common/utils/geetest.ts` 实际加载的脚本地址，其 origin 必须出现在
 *      CSP 的 `script-src` 里 —— 换 CDN 域名而不改 CSP 会在这里红。
 *   2. CSP 本身不能被删掉、也不许把 `default-src` 放宽成通配 —— 治「CSP 挡了
 *      第三方脚本」的正确解法是**按域放行**，不是把 CSP 摘了。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const readSource = (relativePath: string) => readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

/** 取出 meta 里的 CSP 原文。 */
const readCsp = () => {
  const html = readSource("src/index.html");
  const matched = /http-equiv="Content-Security-Policy"[^>]*?content="([^"]*)"/.exec(html);
  expect(matched, "src/index.html 里必须有 CSP meta").not.toBeNull();
  return matched![1];
};

/** 解析成 directive → 取值数组。 */
const parseCsp = (csp: string) =>
  Object.fromEntries(
    csp
      .split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [name, ...values] = part.split(/\s+/);
        return [name, values] as const;
      }),
  );

/** `geetest.ts` 里所有 `script.src = "…"` 的 origin。 */
const geetestScriptOrigins = () =>
  [...readSource("src/common/utils/geetest.ts").matchAll(/script\.src\s*=\s*"([^"]+)"/g)].map(
    match => new URL(match[1]).origin,
  );

describe("渲染层 CSP", () => {
  test("CSP 存在，且默认策略仍收在 'self'", () => {
    const directives = parseCsp(readCsp());
    expect(directives["default-src"]).toEqual(["'self'"]);
    expect(directives["object-src"]).toEqual(["'none'"]);
  });

  test("极验脚本的 origin 在 script-src 白名单里", () => {
    const directives = parseCsp(readCsp());
    const origins = geetestScriptOrigins();

    expect(origins.length, "geetest.ts 应当有明确的脚本地址").toBeGreaterThan(0);
    expect(directives["script-src"]).toContain("'self'");
    for (const origin of origins) {
      expect(directives["script-src"], `${origin} 未在 script-src 里放行`).toContain(origin);
    }
  });

  test("script-src 没有被放宽成通配 scheme", () => {
    const directives = parseCsp(readCsp());
    // 允许 `https:` 这种全 scheme 放行，等于把 CSP 的 script 保护整条撤掉。
    expect(directives["script-src"]).not.toContain("https:");
    expect(directives["script-src"]).not.toContain("http:");
    expect(directives["script-src"]).not.toContain("*");
    expect(directives["script-src"]).not.toContain("'unsafe-inline'");
    expect(directives["script-src"]).not.toContain("'unsafe-eval'");
  });
});
