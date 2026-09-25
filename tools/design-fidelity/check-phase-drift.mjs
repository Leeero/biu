#!/usr/bin/env node
/**
 * 阶段边界漂移检查：把「本阶段只增不改」这条承诺变成可执行的闸门。
 *
 * 为什么需要它：1:1 重构的每个阶段都会声称「渲染不变 / 只增不改」。这句话不能靠
 * 人眼比对，也不能靠"我改的时候很小心"。P0 收尾时实测出 6 个遗留令牌的解析文本变了
 * （圆角四条 + 缓动两条）；其中只有 --biu-radius-lg 真的改变了有效值（16px → 20px），
 * 另外三条是「派生表达式 → 字面值」的同值改写。没有这个工具，这两种情况只能靠嘴说。
 *
 * 两个关键能力，缺一个就会误判：
 *   1. 主题变量补齐。基线里 --biu-radius-md: var(--heroui-radius-medium) 无法只靠
 *      令牌文件解析，必须补入 HeroUI 的主题值（构建产物优先，组件库默认值兜底），
 *      否则会把「同值改写」误报成违规。
 *   2. 长度表达式求值。calc(12px + 4px) 与 16px 必须判为相等，否则 4 条圆角全报违规。
 *
 * 判定分类（「显式确认」= 在声明文件里标 visualImpact: true）：
 *   · 有效值变了且被业务代码消费   → 必须显式确认，否则退出码 1
 *   · 两侧无法求值等价且被消费     → 同样必须显式确认（工具证明不了等价，只能由人确认）
 *   · 令牌消失且被业务代码消费     → 违规
 *   · 未被消费的偏差               → 必须写进声明文件，但无需确认可视影响
 *
 * 已知边界：声明按**令牌名**取文件中的最后一次赋值，所以同一令牌若散落在多个
 * 选择器分支里（如曾经并存的 `:root, .light` 与 `.dark`），只有最后一段参与比对。
 * 「令牌层保持唯一 :root」是这条规则成立的前提：改动令牌层时不要引入新分支。
 *
 * 声明文件：tools/design-fidelity/phase-boundary.json（先声明，后改代码）
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const TOKEN_DIR = path.join(ROOT, "src/ui/tokens");
const DECLARATION = path.join(ROOT, "tools/design-fidelity/phase-boundary.json");
const CONSUMER_DIRS = ["src", "electron", "shared"];
const THEME_LAYOUT = "node_modules/@heroui/theme/dist/default-layout.js";
const BUILT_CSS_DIR = path.join(ROOT, "dist/web/static/css");

const require = createRequire(import.meta.url);
const sh = (...args) => {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
};

/* ------------------------------------------------------------ 长度表达式求值 */

/** 把 calc()/max()/min() 里的长度表达式求成 px 数值；求不动就返回 null。 */
const evaluateLength = expression => {
  if (typeof expression !== "string") return null;
  const source = expression.replace(/\s+/g, "");
  if (source === "" || /[a-df-z]/i.test(source.replace(/calc|max|min|px|rem|em/g, ""))) return null;

  let index = 0;
  const toPx = value => (value.unit === "rem" || value.unit === "em" ? value.value * 16 : value.value);

  const parsePrimary = () => {
    const rest = source.slice(index);
    const fn = rest.match(/^(calc|max|min)\(/);
    if (fn) {
      index += fn[0].length;
      const args = [];
      for (;;) {
        const parsed = parseSum();
        if (parsed === null) return null;
        args.push(parsed);
        if (source[index] === ",") {
          index += 1;
          continue;
        }
        break;
      }
      if (source[index] !== ")") return null;
      index += 1;
      const values = args.map(toPx);
      if (values.some(value => !Number.isFinite(value))) return null;
      if (fn[1] === "calc") return { value: values[0], unit: "px" };
      return { value: fn[1] === "max" ? Math.max(...values) : Math.min(...values), unit: "px" };
    }
    if (source[index] === "(") {
      index += 1;
      const inner = parseSum();
      if (inner === null || source[index] !== ")") return null;
      index += 1;
      return inner;
    }
    const literal = rest.match(/^(\d+(?:\.\d+)?)(px|rem|em)?/);
    if (!literal) return null;
    index += literal[0].length;
    return { value: parseFloat(literal[1]), unit: literal[2] ?? "px" };
  };

  const parseProduct = () => {
    let left = parsePrimary();
    if (left === null) return null;
    while (source[index] === "*" || source[index] === "/") {
      const operator = source[index];
      index += 1;
      const right = parsePrimary();
      if (right === null) return null;
      const a = toPx(left);
      const b = toPx(right);
      left = { value: operator === "*" ? a * b : a / b, unit: "px" };
    }
    return left;
  };

  const parseSum = () => {
    let left = parseProduct();
    if (left === null) return null;
    while (source[index] === "+" || source[index] === "-") {
      const operator = source[index];
      index += 1;
      const right = parseProduct();
      if (right === null) return null;
      left = { value: toPx(left) + (operator === "+" ? toPx(right) : -toPx(right)), unit: "px" };
    }
    return left;
  };

  const parsed = parseSum();
  if (parsed === null || index !== source.length) return null;
  return toPx(parsed);
};

/* -------------------------------------------------------------- 令牌与主题 */

const collectDeclarations = ref => {
  const out = new Map();
  for (const name of fs.readdirSync(TOKEN_DIR).filter(name => name.endsWith(".css"))) {
    const relative = `src/ui/tokens/${name}`;
    const css = ref ? sh("show", `${ref}:${relative}`) : fs.readFileSync(path.join(TOKEN_DIR, name), "utf8");
    if (!css) continue;
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of stripped.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
      out.set(match[1], match[2].replace(/\s+/g, " ").trim());
    }
  }
  return out;
};

const toKebab = text => text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 补入外部主题变量：组件库默认值打底，构建产物（可能被项目主题覆盖）优先。 */
const collectThemeVars = () => {
  const out = new Map();
  const sources = [];
  const walk = (node, prefix) => {
    if (typeof node === "string" || typeof node === "number") {
      out.set(`--heroui-${prefix.map(toKebab).join("-")}`, String(node));
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) walk(value, [...prefix, key]);
  };
  try {
    const layout = require(path.join(ROOT, THEME_LAYOUT));
    if (layout.defaultLayout) {
      walk(layout.defaultLayout, []);
      sources.push("@heroui/theme 默认布局");
    }
  } catch {
    /* 组件库结构变了就只靠构建产物 */
  }
  if (fs.existsSync(BUILT_CSS_DIR)) {
    let found = 0;
    for (const name of fs.readdirSync(BUILT_CSS_DIR).filter(name => name.endsWith(".css"))) {
      const css = fs.readFileSync(path.join(BUILT_CSS_DIR, name), "utf8");
      for (const match of css.matchAll(/(--heroui-[\w-]+)\s*:\s*([^;{}]+)/g)) {
        out.set(match[1], match[2].trim());
        found += 1;
      }
    }
    if (found > 0) sources.push(`构建产物（${found} 条）`);
  }
  return { vars: out, sources };
};

/** 解 var() 链；仍解不动的引用原样保留，以便识别为「无法判定」。 */
const resolve = (name, tables, chain = []) => {
  if (chain.includes(name)) return { value: undefined, unresolved: true };
  let raw;
  for (const table of tables) {
    if (table.has(name)) {
      raw = table.get(name);
      break;
    }
  }
  if (raw === undefined) return { value: undefined, unresolved: true };
  let unresolved = false;
  const value = raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (all, ref) => {
    const inner = resolve(ref, tables, [...chain, name]);
    if (inner.unresolved || inner.value === undefined) {
      unresolved = true;
      return all;
    }
    return inner.value;
  });
  return { value, unresolved };
};

/** 被业务代码实际引用的令牌（令牌层自身不算消费方）。 */
const collectConsumed = () => {
  const consumed = new Set();
  for (const dir of CONSUMER_DIRS) {
    if (!fs.existsSync(path.join(ROOT, dir))) continue;
    for (const relative of sh("ls-files", dir).split("\n").filter(Boolean)) {
      if (relative.startsWith("src/ui/tokens/")) continue;
      if (!/\.(tsx?|css|mjs|cjs|js)$/.test(relative)) continue;
      // `git ls-files` 覆盖「工作树已删除、但仍在索引里」的文件（如刚被重构删掉的目录）。
      // 不过滤会让工具在移动/删除文件后直接崩溃，而不是给出判定结果。
      const full = path.join(ROOT, relative);
      if (!fs.existsSync(full)) continue;
      const text = fs.readFileSync(full, "utf8");
      for (const match of text.matchAll(/var\(\s*(--biu-[\w-]+)/g)) consumed.add(match[1]);
    }
  }
  return consumed;
};

/* -------------------------------------------------------------------- 主流程 */

const declaration = fs.existsSync(DECLARATION)
  ? JSON.parse(fs.readFileSync(DECLARATION, "utf8"))
  : { baselineRef: "HEAD", intendedChanges: {} };
const baselineRef = process.argv[2] ?? declaration.baselineRef ?? "HEAD";
const intended = new Map(Object.entries(declaration.intendedChanges ?? {}));

const before = collectDeclarations(baselineRef);
if (before.size === 0) {
  console.error(`无法读取基线 ${baselineRef} 的令牌声明，检查 ref 是否存在。`);
  process.exit(2);
}
const after = collectDeclarations(null);
const theme = collectThemeVars();
const consumed = collectConsumed();
const tableOf = declarations => [declarations, theme.vars];

const numericOrChanged = (name, from, to) => {
  const a = resolve(name, tableOf(from));
  const b = resolve(name, tableOf(to));
  if (b.value === undefined) return { kind: "disappeared", name, consumed: consumed.has(name) };
  if (a.value === b.value) return { kind: "same" };
  const na = a.unresolved ? null : evaluateLength(a.value);
  const nb = b.unresolved ? null : evaluateLength(b.value);
  if (na !== null && nb !== null && na === nb) return { kind: "same" };
  if (na !== null && nb !== null) {
    return {
      kind: "value",
      name,
      before: `${a.value} = ${na}px`,
      after: `${b.value} = ${nb}px`,
      consumed: consumed.has(name),
    };
  }
  return { kind: "expression", name, before: a.value, after: b.value, consumed: consumed.has(name) };
};

const results = [...before.keys()].map(name => numericOrChanged(name, before, after));
const valueChanges = results.filter(item => item.kind === "value");
const expressionChanges = results.filter(item => item.kind === "expression");
const disappeared = results.filter(item => item.kind === "disappeared");
const deviations = [...valueChanges, ...expressionChanges, ...disappeared];

const acknowledged = item => intended.get(item.name)?.visualImpact === true;
const undeclared = deviations.filter(item => !intended.has(item.name));
// 统一口径：**任何**被业务代码消费的偏差都必须显式确认，不只是「有效值变更」。
//   · 有效值变更        → 会掉像素，当然要确认；
//   · 表达式改写        → 两侧至少一侧无法求值时，工具证明不了等价，只能由人确认；
//                        漏掉这一类，「把消费型令牌改成非可求值形式」就成了后门。
//   · 令牌消失          → 消费方会拿到无效值，同样要确认。
// 写进声明文件只代表「登记过」，标 visualImpact 才代表「有人确认过它会掉像素」。
const needsAcknowledgement = deviations.filter(item => item.consumed);
const unacknowledged = needsAcknowledgement.filter(item => !acknowledged(item));

console.log(`阶段边界检查：基线 ${baselineRef} → 工作区`);
console.log(`  基线遗留令牌 ${before.size} 个；被业务代码消费 ${consumed.size} 个`);
console.log(`  主题变量来源：${theme.sources.join("、") || "（无，含 --heroui-* 的表达式将无法判定）"}\n`);

if (deviations.length === 0) {
  console.log("✓ 遗留令牌的有效值无任何变化。");
}
for (const item of valueChanges) {
  const tag = item.consumed ? (acknowledged(item) ? "! 已确认可视变更" : "✗ 违规") : "· 未消费";
  console.log(`${tag} 有效值变更 ${item.name}${intended.has(item.name) ? "（已声明）" : "（未声明）"}`);
  console.log(`      ${item.before}\n   →  ${item.after}`);
  if (intended.has(item.name)) console.log(`      理由：${intended.get(item.name).reason}`);
}
for (const item of expressionChanges) {
  // 与 value / disappeared 两个分支同口径：只有「已声明但未确认」才该喊违规。
  // 之前这里对任何消费型改写都硬编码「需确认」，导致已确认的条目也在报警——
  // 一个永远在喊的标签只会训练操作者忽略它。
  const tag = item.consumed ? (acknowledged(item) ? "! 已确认表达式改写" : "✗ 违规") : "· 未消费";
  console.log(`${tag} 表达式改写 ${item.name}${intended.has(item.name) ? "（已声明）" : "（未声明）"}`);
  console.log(`      ${item.before}\n   →  ${item.after}`);
  const reason = intended.get(item.name)?.reason;
  console.log(reason ? `      理由：${reason}` : "      两侧至少一侧无法求值，需人工确认等价性");
}
for (const item of disappeared) {
  const tag = item.consumed ? (acknowledged(item) ? "! 已确认删除" : "✗ 违规") : "· 未消费";
  console.log(`${tag} 令牌消失 ${item.name}${intended.has(item.name) ? "（已声明）" : "（未声明）"}`);
}

console.log();
if (unacknowledged.length > 0) {
  console.error(`失败：${unacknowledged.length} 处「被业务代码消费的令牌发生变更」没有显式确认。`);
  console.error("这类改动会掉像素（或无法证明等价）。确认后请在 phase-boundary.json 对应条目上标");
  console.error("visualImpact: true 并写明理由。");
  for (const item of unacknowledged) console.error(`  · ${item.name}  ${item.before} → ${item.after}`);
} else if (undeclared.length > 0) {
  console.error(`失败：${undeclared.length} 处偏差未在 phase-boundary.json 中声明。未声明的偏差 = 没人评审过的变更。`);
  for (const item of undeclared) console.error(`  · ${item.name}`);
} else {
  const confirmed = needsAcknowledgement.length;
  console.log(
    `通过：${deviations.length} 处偏差均已声明${confirmed > 0 ? `，其中影响业务代码的 ${confirmed} 处已显式确认` : "，无可视变化"}。`,
  );
}
process.exit(unacknowledged.length > 0 || undeclared.length > 0 ? 1 : 0);
