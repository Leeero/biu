# design-fidelity · C+ 保真度校验工具

保证「按视觉稿重构」这件事**可执行、可验证、不可绕过**。前四件对应 [`../../docs/design/biu-cplus-refactor-plan.md`](../../docs/design/biu-cplus-refactor-plan.md) §7 的三道闸门，其余是辅助件（它们是**手段**，不参与判定）。

| 工具                          | 闸门       | 作用                                                              |
| ----------------------------- | ---------- | ----------------------------------------------------------------- |
| `verify.py`                   | 自动化比对 | 以 1440 × 900 捕获目标，与设计稿 PNG 做三层判定，输出 PASS / FAIL |
| `check-literals.mjs`          | 代码护栏   | 按令牌三层边界拦截：字面色值越层、原始色板越层、HeroUI 主题回退   |
| `tests/design-tokens.test.ts` | 真值对照   | 把 `cplus-spec-lock.json` 逐项断言到 CSS 令牌，任一侧漂移即失败   |
| `check-phase-drift.mjs`       | 阶段边界   | 比较基线与工作区的遗留令牌有效值，把「只增不改」变成可执行闸门    |
| `correct_reference.py`        | 参考图纠正 | 修参考图自身的几何失真（第 8 页纵向压缩），并堵住生成路径的复发   |
| `extract_reference.py`        | 辅助诊断   | 从设计稿 PNG 提取逐屏结构基准，用于排查测量异常                   |
| `build-app.mjs`               | 辅助构建   | 用 rsbuild Node API 构建 web 产物并**手动落盘**（绕过本机写盘失效） |
| `serve-app.mjs`               | 辅助伺服   | 把 `dist/web` 以 SPA 方式伺服给 `verify.py --target app`          |
| `measure-dom.mjs`             | 辅助测量   | 用 CDP 量**真实 DOM 几何**：PNG 带分析答「差多少」，它答「差在哪」 |

**`measure-dom.mjs` 为什么必须有**：PNG 带分析能把「设计 vs 渲染」的差异压成一个
数，但那个数**不带病因** —— 卡片内边距错了、某一层 margin 错了、还是居中算错了，
在截图上都是同一片位移。屏 07 就是靠它闭合的：正文列高 148.5、内容盒高 200.25 ⇒
居中偏移 25.875，加包装层行盒上承载 1.5 = 27.375，与实测 382.33 − 354.95 = 27.38
逐值一致 —— 于是「居中没错，是设计稿的正文列更高」才成为有依据的判断，而不是猜。
它也看得见**稿面上没有对应物**的盒子（包装层高度、行盒承载）。

```bash
node tools/design-fidelity/measure-dom.mjs \
  'http://127.0.0.1:4173/#/?fixture=07-discover-card' \
  'article' 'article h3' 'article > div:nth-child(2)'
```

**分工**：`verify.py` 判「像不像」（唯一有 PASS/FAIL 权的），`measure-dom.mjs`
答「为什么」。后者**不参与判定** —— 闸门永远只认像素。

**参考图体检**（`verify.py --reference-only`）与上面三道护栏**一并接入 CI**（`.github/workflows/pr-test-build.yml` 的 `Token Guardrails` job，在 `src/ui/tokens/**`、`tools/design-fidelity/**`、`tests/design-tokens.test.ts`、`docs/design/cplus-spec-lock.json` 变更时触发）。它抓的是**参考图本身**：参考图错了，后面每一道闸门都只会忠实地报「实现不对」—— 第 8 页的纵向压缩就是这样活了两个阶段的。

---

## 快速开始

```bash
# 1. 保真度校验（默认比对原型；接开发服务器用 --target=app）
bash tools/design-fidelity/run.sh --list
bash tools/design-fidelity/run.sh --all
bash tools/design-fidelity/run.sh --screen 11-settings --verbose
bash tools/design-fidelity/run.sh --screen 10-now-playing --target app --base-url http://localhost:5678

# 2. 令牌护栏
node tools/design-fidelity/check-literals.mjs
node tools/design-fidelity/check-literals.mjs --list     # 查看存量白名单与清理阶段
node tools/design-fidelity/check-literals.mjs --staged   # 仅检查暂存文件，适合 pre-commit

# 3. 令牌真值对照
pnpm exec vitest run tests/design-tokens.test.ts

# 4. 阶段边界（相对基线的遗留令牌只增不改）
pnpm verify:phase-drift                 # 基线取 phase-boundary.json 的 baselineRef
pnpm verify:phase-drift origin/main      # 指定基线 ref

# 5. 参考图体检（不捕获渲染、不需要 Chrome；CI 与本机快查同一入口）
pnpm verify:reference
python tools/design-fidelity/correct_reference.py --check       # 已登记失真页的纠正状态
python tools/design-fidelity/correct_reference.py --selftest    # 回归：生成路径不再压扁画板
```

### 本机跑 `--target app`：走「构建 + 静态伺服」而不是 dev server

本机存在一个**环境级**问题：rspack 的文件写入被静默丢弃 —— `rsbuild build` / `dev`
都报「built 成功」并列出产物，而 `dist/web` 实际为空；dev server 也因此对 `/` 返回
404（HTML 在内存里没落地）。排查过：非沙箱、非 `cleanDistPath`、非权限/磁盘、
非 electron 插件、非 `writeToDisk` 配置。

绕法是 `build-app.mjs`。它同时绕过**两个**独立的坎 —— 只解决第一个会得到一包
「产物齐了但一打开就白屏」的东西，所以两个都得写下来：

1. **产物不落盘**：构建后从 `stats.compilation.assets`（内存里的 Source）逐个取
   内容，用 Node 的 `fs.writeFile` 写盘 —— Node 自己写盘是正常的。
2. **程序化调用拿不到配置里的 `plugins`**：`createRsbuild({ cwd })` 会读到
   `dev` / `server` / `html` / `output`，**但 `plugins` 是空的**。于是 pluginReact
   不生效（swc 退回 classic runtime，产物里全是 `React.createElement`，而源码没有
   `import React` → 浏览器 `ReferenceError: React is not defined`，整页空白），
   pluginSvgr 也不生效（`.svg` 落回 `svg-asset`，`ReactComponent` 具名导出不存在，
   报 `ESModulesLinkingError`）。**CLI 没有这个问题**，因为它显式 `loadConfig()`
   之后再把结果交给 `createRsbuild` —— `build-app.mjs` 照抄这个做法，于是 1 与 2
   可以同时满足。**自检必须验到这一条**：脚本末尾会数产物里的 `React.createElement`
   （应为 0）与模块图里的 `react/jsx-runtime`（应 ≥ 1），不合格就非零退出 ——
   只看「落盘 N 个产物」会漏掉这一类白屏。

之后用 `serve-app.mjs` 伺服，比对目标就是**发布形态的产物**（比 dev 变换后的代码更该被验收）：

```bash
node tools/design-fidelity/build-app.mjs                      # → dist/web（手动落盘）
node tools/design-fidelity/serve-app.mjs --root dist/web --port 4173
bash tools/design-fidelity/run.sh --screen 07 --target app --base-url http://127.0.0.1:4173
```

`build-app.mjs` 会带 `BIU_WEB_ONLY=1`，跳过 Electron 主进程打包与 electron-builder 封装
（后者还要 Xcode 的 `actool`，本机没有）。构建末尾 rspack 在关闭编译器时可能报
`Rspack build failed`，**但产物已经落盘** —— 判断成功与否看那行「手动落盘 N 个产物」，
不要看退出码。

`run.sh` 会自动准备 Python 环境（在 `tools/design-fidelity/.venv` 内安装 `pillow` + `numpy`）。若已有可用解释器：

```bash
BIU_FIDELITY_PYTHON=/path/to/python bash tools/design-fidelity/run.sh --all
```

需要 Chrome / Chromium（`/Applications/Google Chrome.app`、`google-chrome`、`chromium` 任一）。

`verify.py` 以 `--headless=new --no-sandbox` 启动它。**`--no-sandbox` 不是可选项**：受限环境下 Chrome 初始化不了自己的进程沙箱（`Failed to initialize sandbox: Operation not permitted`），连带 GPU 进程 FATAL 退出，结果一张图都不写。沙箱是进程隔离，与页面渲染无关，关掉它不改变任何像素。截图失败时 `verify.py` 会打印 Chrome stderr 的末几行——没有这几行，「截图失败」四个字提供不了任何病因，而它曾让一轮排查空转。

---

## 判定模型

| 层 | 判据 | 阈值 | 说明 |
| --- | --- | --- | --- |
| **L1 硬锚点** | 渲染实测 **vs 设计实测**：顶栏厚、播放栏厚、内容左留白、行距 | 零偏差（1px 容差） | 骨架不允许偏差 |
| **L2 结构带** | `H1` / `lead` / `filter` / `playbar` 的起点与带数 | ±2px 且带数一致 | 结构性定位 |
| **L2 内容带** | `list` / `right` / `note` 的覆盖率 | ≥ 75%（±4px 配对） | 内容带随文案与封面变化，逐条严格相等不合理 |
| **L3 整屏观感** | 整屏平均亮度差 | ≤ 12 | 抓 L1/L2 抓不到的：玻璃、遮罩、渐变、封面明度 |

沉浸态（第 10 屏）用独立探针组：`art` / `infoTitle` 为结构带，`lyrics` / `bottom` 为内容带；L1 只锚定封面左缘、上缘与底部控制带顶边。

### 为什么 L1 是「渲染 vs 设计」而不是「渲染 vs 令牌」

早期版本把渲染实测与令牌值（顶栏 71）直接比，结果 H1 左缘量到 67（字形左边距）而被判失败。改为两侧用同一套探针后，测量误差在比较中自然抵消，判定只反映真实差异。

### 为什么内容带用覆盖率

设计稿的曲目文案、封面明度、用户名长度与实现必然不同，逐条严格相等会持续误报。覆盖率保证**结构节奏**没被破坏：设计稿里存在的文本带，至少 75% 能在实现里找到对应位置。

### 沉浸态封面尺寸为何不计入判定

沉浸态背景辉光与封面亮度区间重叠，自动测量无法稳定分离两者。因此只锚定左缘（64）与上缘（60），尺寸作为「参考」行打印。设计稿索引原文为 639 × 359，原型实现为 649 × 365，差异已登记在 `cplus-spec-lock.json` 的 `immersiveGeometry.knownResidual`，由 P5 收敛。

---

## 设计稿参考图

`reference/page-02.png` … `page-13.png`（1440 × 900，共 2.9 MB）是比对基准，已纳入仓库，使校验不依赖本机 `/tmp`。

重新生成：

```bash
tools/design-fidelity/prepare_reference.sh "/path/to/Biu 2.0 · C+ 视觉稿.pdf"
```

依赖 `pdftoppm`（macOS：`brew install poppler`）。脚本以 110 dpi 渲染（2200 × 1375），再按**保宽等比**缩放到 1440 × 900。

> 设计稿画板为满幅 2200 × 1375（比例精确 1.60000），四角有约 33px 圆角，圆角外是页面白底。**探针列必须避开 x > 1400 与 y < 40 的圆角区**，否则会量到白底。`verify.py` 的顶栏探针取 x 300–1200 正是为此。

### 画板高度不为 900 的页

第 8 页（屏 07）的 PDF 画板高 **978**。早期的生成脚本对它做的是 `resize((1440, 900))` —— **非等比拉伸**，于是该页被纵向压缩 0.9204：圆变椭圆、71/88 的壳层变 65/81。这个伪影存在了两个阶段，还被登记成「该屏设计壳层与其余页不同」。

现在这条路径由 `correct_reference.py` 的 `fit_canvas()` 统一处理：**保宽等比 → 壳层两端对齐 → 内容取 900 视口能看到的部分**（顶栏 72 行 + 内容 740 行 + 播放栏 88 行）。`prepare_reference.sh` 直接复用它，**从 PDF 重生成不会再压一次**；`--selftest` 会把现有参考图放大回渲染尺寸、走一遍生成路径并比对，防止有人把它改回去。

仓库内的 `reference/page-08.png` 已是纠正后的图，原始失真图留档在 `reference/_source/page-08-raw.png`（**唯一可追溯来源**：源 PDF 不在仓库内，`meta.sourceRender` 指向的 `/tmp` 已失效）。纠正记录在 `cplus-spec-lock.json` 的 `referenceIntegrity.history["8"]`，完整推导见 [`../../docs/design/evidence/reference-page-08-distortion.md`](../../docs/design/evidence/reference-page-08-distortion.md)，落地前后对照图见 [`../../docs/design/evidence/page08-correction-applied.png`](../../docs/design/evidence/page08-correction-applied.png)。

---

## 原型基线（2026-09-25）

`bash tools/design-fidelity/run.sh --all` 对参考原型的实测结果，完整报告见 [`../../docs/design/evidence/prototype-baseline.txt`](../../docs/design/evidence/prototype-baseline.txt)。

**4 / 12 通过。**

| 屏                 | L3 平均亮度差 | 未通过门禁                                        |
| ------------------ | ------------: | ------------------------------------------------- |
| 01 我的音乐库      |         12.20 | L3, list, right                                   |
| 02 我的收藏 · 详情 |         12.17 | L3                                                |
| 03 稍后播放        |          9.45 | —                                                 |
| 04 本地音乐        |          7.94 | list, right                                       |
| 05 下载管理        |          8.73 | note, rowPitch                                    |
| 06 搜索结果        |          9.18 | filter, list, note, right, rowPitch               |
| 07 发现音乐 · 卡片 |         14.55 | L3, 顶栏, 播放栏, lead, filter, list, note, right |
| 08 发现音乐 · 列表 |          9.66 | —                                                 |
| 09 播放队列        |          7.87 | —                                                 |
| 10 正在播放 · 沉浸 |         11.46 | infoTitle, lyrics                                 |
| 11 设置            |          7.06 | —                                                 |
| 12 迷你播放器      |          9.73 | list, note, right                                 |

> 第 07 行里的**顶栏 / 播放栏**两条失败是**参考图伪影**（第 8 页纵向压缩 0.9204），不是原型的问题；该页已于 2026-09-28 纠正，见上文「画板高度不为 900 的页」。其余条目仍按原样留档。
>
> 1.3.21 起屏 06/07 也启用了 `playbarDetail`（三枚实心块探针在**原型侧实测 OK**，`playbarGap` 为设计空带 ⇒ n/a）；这些不在上表的「未通过门禁」列里，因为该列录的是 2026-09-25 的快照。

**原型的定位**：它是本轮之前达成过的参考实现，**不是验收线**。比对对象始终是设计稿 PNG。这张表的作用是给每屏一个明确的「必须超过」的起点。

各屏在哪个阶段达标见 [`../../docs/design/cplus-screen-matrix.md`](../../docs/design/cplus-screen-matrix.md)。

---

## 令牌护栏的三层边界

护栏不只是「拦字面色值」，它按令牌的三层结构分工，越层即失败：

| 规则 | 允许的地方 | 拦截示例 |
| --- | --- | --- |
| 字面色值（`#hex` / `rgb(` / `hsl(` / `oklch(`） | **仅** `src/ui/tokens/palette.css` | 组件里写 `bg-[#1a1a1c]`；`semantic.css` 里写 `--biu-x: #ff0000` |
| 原始色板引用 `var(--c-*)` | `palette.css` 与 `semantic.css` | `geometry.css` 或组件里写 `var(--c-accent)` |
| HeroUI 主题回退 `var(--heroui-*)` | `src/ui/tokens/` 内 | 组件里写 `bg-[rgb(var(--heroui-primary))]` |

另允许四类不构成违规的写法：`rgba(255,255,255,0)`、`transparent`、`currentColor`、`inherit`，以及 `rgb(var(--biu-*))` 这类**不含字面数值**的令牌调用。

### 存量白名单：18 个文件 / 30 处

`check-literals.mjs` 内的 `LEGACY_ALLOWLIST` 登记本轮之前就存在的字面色值及其清理阶段。设计意图：

- 护栏**立即可以开门**，不必等全部历史代码清理完；
- 任何**新增**的字面色值立刻被拦下；
- 每条白名单都写明在哪个阶段随文件删除而失效，**只减不增**。

用 `--list` 查看完整清单。清理阶段分布：P1 两处（`app.css`、`common/constants/theme.ts`）、P2 四处（详情见清单）、P3 一处、P5 五处、P6 四处。

### 意义不在「拦住打字」

护栏真正的作用是让**视觉决策只能有一份**。P0 落地时它立刻暴露了三处真值分叉（沉浸态渐变记错、对比度照旧底板算、合成色漏登记）—— 这些都不是笔误，而是「文档与实现各写一份」的必然结果。护栏不会让第一份文档变对，但会让第二份无法存在。

---

## 阶段边界：把「只增不改」变成闸门

分阶段重构的每个阶段都会声明「本阶段不动渲染」。这句话如果只写在文档里，它和没写没有区别 —— P0 收尾时实测出 **6 个遗留令牌的解析值确实变了**（圆角四条、缓动两条）。之所以最终没有掉像素，是因为其中 5 个当时还没有消费方，而不是因为改得安全。这类结论必须由工具给，不能由人拍。

`check-phase-drift.mjs` 的做法是：取基线 ref 的令牌声明，与工作区逐名解析 `var()` 链后比较，并按「是否被业务代码消费」分类。

### 两个让它不误判的关键细节

不处理这两点，护栏会满屏假警报，然后被人关掉：

1. **补入外部主题变量。** 基线的 `--biu-radius-md: var(--heroui-radius-medium)` 只靠令牌文件解析不出来，会与工作区的 `12px` 判为「不同」。工具因此补入 HeroUI 的主题值（`@heroui/theme` 默认布局打底，构建产物优先，可覆盖项目主题），实际取到 `--heroui-radius-medium: 12px`。
2. **对长度表达式求值。** `calc(12px + 4px)` 与 `16px` 必须判为相等。工具内置了 `calc()` / `max()` / `min()` / 四则运算的求值器，把 `max(4px, calc(12px - 4px))` 与 `8px` 判为同一个值。缺这一步，四条圆角全会误报违规。

### 判定分类

| 情况                             | 处理                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| 有效值变了 **且** 被业务代码消费 | 违规。必须写进声明并显式标 `visualImpact: true`，否则退出码 1 |
| 有效值变了但未被消费             | 必须写进声明文件，否则退出码 1                                |
| 只剩表达式改写（两侧无法求值）   | 必须写进声明文件；工具不替你判断等价性                        |
| 令牌消失且被消费                 | 违规                                                          |

声明文件是 [`phase-boundary.json`](./phase-boundary.json)：**先声明、再改代码**。声明本身就是评审记录，它迫使「我知道这处会变、理由是……」成为一次书面确认。`visualImpact: false` 与 `true` 的区别不是形式主义 —— 前者是「同值改写」，后者是「会掉像素，已确认」。

### P0 的实测结论

| 令牌 | 变化 | 被消费 | 处理 |
| --- | --- | --- | --- |
| `--biu-radius-lg` | 16px → 20px | ✅ 8 个组件 | **已确认可视变更**（P0 唯一处） |
| `--biu-radius-sm` | `max(4px, calc(12px - 4px))` → `8px` | ❌ | 同值改写 |
| `--biu-radius-md` | `var(--heroui-radius-medium)` → `12px` | ✅ 6 个组件 | **有效值相同（均 12px）**，无可视影响 |
| `--biu-radius-xl` | `calc(12px + 8px)` → `20px` | ✅ 2 个组件 | 有效值相同（均 20px） |
| `--biu-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` → C+ 值 | ❌ | 无消费方；P1 由新动效令牌承接 |
| `--biu-ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` → C+ 值 | ❌ | 同上；注意此刻两条缓动取值相同，P1 应重新区分主次 |

`--biu-radius-md/xl` 这两行正是「假警报」与「真结论」的分界：只比文本会说它们变了，求值后才知道没变。**P0 引入的可视变更只有一处**，且已被方案 §13 声明在先。

---

## 数据夹具

`fixtures/` 承载两类东西：

1. **逐屏固定数据** —— 让比对不受真实数据波动影响（`01-library.json` / `02-playlist-detail.json` / `06-search.json` / `07-discover-card.json`；其余随对应屏施工落地）。**文件名 = `screens[].no`**，`verify.py` 由原型文件名反查、以 `?fixture=<stem>` 注入。
2. **占位素材** —— 封面渐变等。这些是数据不是令牌，所以它们的色值写在这里，不进 `palette.css`。`placeholder-art.json` 已就绪。

契约见 [`fixtures/README.md`](./fixtures/README.md)。在逐屏夹具就位前，`--target app` 的比对只能用于**验证流程可跑通**，不能用于判定 PASS / FAIL。

### 夹具与闸门之间的两根接线（`tests/now-playing-fixtures.test.ts`）

夹具能带出**页面**内容，带不出**播放栏** —— 后者是全局组件，读 `usePlayList` /
`usePlayProgress`，只认 `src/features/player/now-playing.ts` 的 `NOW_PLAYING_FIXTURES`
登记表。于是「夹具 vs 闸门」之间存在两根**靠人记得**的接线，1.3.20 时两根同时断了：

| 断法                                                 | 后果                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| 夹具写了 `nowPlaying`，忘了登记进 `NOW_PLAYING_FIXTURES` | 设计稿是满态、渲染是空态 —— **看得见，但没人判**（屏 07）             |
| 该屏真值里没有 `playbarDetail`                        | 栏内构成零闸门，`playbar` 结构带只判「栏高 88」—— **看不见也没人判**（屏 06/07） |

所以那条单测遍历 `fixtures/*.json`（与 `verify.py` 同一批取数源，**将来的新屏会自动被扫到**），
断言：① 凡声明 `nowPlaying` 的屏必须在登记表里、且与 JSON 逐字一致、且无孤儿登记；
② 凡声明 `nowPlaying` 的屏，`spec-lock` 里必须有 `playbarDetail`，且探针与实测值成对齐全。
这两条守的不是某一份夹具的内容，而是接线本身 —— 与 P0 的「登记即断言」同族。

---

## 扩展：断点比对

`verify.py` 目前只在 1440 × 900 判定保真度。骨架一旦锚定，窗口宽度变化时**只有标题列伸缩**。若需要验证这一行为，可在 `verify.py` 中增加 `--width` 参数，复用 `probe()` 并断言：`topbarHeight` / `playbarHeight` / `gutterLeft` / `rowPitch` 不随宽度改变。
