# Biu → lili 改名方案

> 取证时间：2026-10-10 ｜ 基线提交：`9b0e8e4`（2026-10-09）
> 本次改名已完成，落地提交见 §8。
> 本文件所有数字均由 `grep` / `git` 实测得出，未做估算。
> 文档正文里出现 `--biu-` / `com.biu.wood3n` 这类**旧名**是刻意的：改名记录必须能说出改之前的名字。

---

## 0. 先回答：这种方式被原项目允许吗

### 0.1 事实基线

| 项 | 实测值 |
|---|---|
| 上游仓库 | `github.com/wood3n/biu`（Bilibili 音乐播放器） |
| 上游最后提交 | `2026-01-20T09:26:18Z`（`7d49920`） |
| 本仓历史 | 738 条提交；429 条 `wood3n` + 95 条 `oxyg3n` + 其余社区与本地（`lero` / `leroli` 等） |
| fork 分界 | 上游停更点即 fork 点：`2026-01-20` 之后全部是本地提交（首条本地提交 `bb9146f`，2026-09-23） |
| 许可证 | **PolyForm Noncommercial License 1.0.0**（非 OSI 开源许可，source-available 非商业许可） |
| 许可证正文第 5 行 | `Required Notice: Copyright (c) 2022–2025 wood3n` |

### 0.2 逐条对账（用许可证原文条款说话）

| 你的想法 | 对应条款（原文） | 判定 |
|---|---|---|
| 保留原始项目提交记录 | `Changes and New Works License`：可基于本软件「make changes and new works … for any permitted purpose」 | ✅ 允许 |
| 二开 | 同上 | ✅ 允许 |
| 改名（产品名 / 包名 / 仓库名） | 全文**无商标条款、无「不得改名」条款**；改名属于 changes / new works | ✅ 允许 |
| 分发（发 Release、对外给安装包） | `Distribution License`：可「distribute copies of the software」，含 changes and new works 的副本 | ✅ 允许 |
| 去掉或淡化 wood3n 署名 | `Notices`：必须确保任何拿到副本的人也拿到许可证原文（或 URL）**以及所有以 `Required Notice:` 开头的纯文本行** | ❌ 不允许 |
| 商业化（收费、广告变现、商业集成、公司业务使用） | `Noncommercial Purposes` + `Definitions`（`Your company` 含「你为之工作的法律实体」） | ❌ 不允许，须先取得作者书面授权 |

**结论：你的方案（保留提交记录 + 改名 + 二开）在「非商业用途」前提下是允许的。** 改名本身不受任何限制，真正受限的是「署名」与「商业用途」两件事。

### 0.3 三个最容易踩的点

1. **`Required Notice: Copyright (c) 2022–2025 wood3n` 必须原样保留**，且任何分发副本都要带上 LICENSE 原文或 URL。改名 ≠ 可以去掉版权行。
2. **「注明参考旧项目」式的口头致谢不够。** 法律上只有 `Required Notice:` 那一行是硬要求，但它必须逐字存在。已额外落 `NOTICE` 文件（§8 提交 4）。
3. **PolyForm Noncommercial 不是开源许可。** 不能以「原项目是开源的」为由扩大使用范围；它只授予非商业目的下的修改与分发权，且明确禁止 sublicense / transfer。

### 0.4 商业闸门（已按你的答复关闭）

本仓提交里有 `leroli <leroli@tencent.com>` 署名 21 条。PolyForm 的 `Your company` 定义覆盖「你为之工作的法律实体」，因此**只要这个 fork 以任何形式服务于公司业务，就已滑出 permitted purpose**。

> 你的答复：**不含商业**。因此该闸门关闭，本方案成立。
> 这是许可证正文的事实陈述，不构成法务意见。若将来要走商业路径，先联系 wood3n 取得授权，别先动手。

---

## 1. 工作量：先数出来

命中统计（大小写不敏感，`grep -rilE` / `-rioE`；已排除 `node_modules` / `dist` / `.electron` / `.git` / `.venv`）：

| 范围 | 命中文件 | 命中处数 | 处置 |
|---|---|---|---|
| `src/` | 94 | 1677 | 改（其中 1665 处是一条 sed） |
| `tests/` | 6 | 86 | 改（含契约测试基线） |
| `docs/` | 42 | 594 | **分级**（见 §5） |
| `prototypes/` | 40 | 81 | **分级**（见 §5：只有 `c-plus-2026` / `home-redesign` 改） |
| `tools/design-fidelity/` | 17 | 79 | 改（**保真护栏，见 §2.3**） |
| `README.md` + `package.json` + `design-qa.md` + `changelog.config.json` | 2 | 32 | 改 |
| `electron/` | 8 | 13 | 改 |
| `plugins/` | 2 | 9 | 改 |
| `.github/` | 3 | 5 | 改 |
| `shared/` | 0 | 0 | ✅ 干净，无需改 |
| `screenshots/` | 0（文本） | 0（文本） | ⚠️ **图片内容含字标，必须重截**（见 §3.4） |
| `CHANGELOG.md` | 1 | **424** | ❌ **绝对不改** |
| `dist/` `.electron/` `.venv/` | — | — | 构建产物 / 第三方，重新生成即可 |

**拆解后的真实工作量：**

- **需要动手的总量 ≈ 1900 处**，但其中 **1665 处是一条 sed 扫完的 CSS 令牌前缀**，`biu-theme-4188` 73 处、`os-theme-biu` 6 处也是同一条 sed 的量级。
- **真正的手工活只有约 80 处**：产品标识串、打包配置、CI、文案、README。
- CHANGELOG 的 424 处是总数里最大的一块，**不要算进工作量**——它是自动生成的发布历史，改了破坏可追溯性。
- 结论：**机械替换半天量级**。真正的成本全在 §2 的三个非机械项上。

**关键拆分数字：**

```
--biu-* 令牌出现        1665 处 / 368 个去重变量名
  └─ --biu-4188-*        548 处（92 个去重名）
  └─ --biu- 其它         1117 处（276 个去重名）
biu-theme-4188           73 处
os-theme-biu              6 处
非令牌 biu 命中（代码层）   52 处（src+electron+tests+plugins+shared）
```

**术语口径（重要，容易混读）：** 本项目文档里的「**Biu 2.0 / lili 2.0**」指的是 2026-09 起的那次 C+ 重构**代次**，不是应用版本号；应用版本号由 `package.json` 承载，本次改名时由 `1.16.0` 重启为 `2.0.0`。所以「产品名 Biu→lili」只换名字，代次标签 `2.0` **保持不变**。两者数值上都是 `2` 纯属巧合——代次是**重构批次**，版本号是**发行序号**，语义无关，不要互相推导。

---

## 2. 三个真雷（非机械项）

### 2.1 userData 路径 —— 唯一的真雷，会丢用户数据

**证据（项目自己的 bug 模板写死了路径）**：`.github/ISSUE_TEMPLATE/bug-report.yml:38-40`

```
Windows: C:/Users/<用户名>/AppData/Roaming/Biu/logs/main.log
macOS:   ~/Library/Application Support/Biu/logs/main.log
Linux:   ~/.config/Biu/logs/main.log
```

即 `app.getPath("userData")` 由 `productName: "Biu"` 推导（`package.json` 与 `plugins/electron-build.ts` 两处都是）。

**后果**：改 productName → userData 目录变 → 老用户的登录态、收藏、播放队列、下载记录、歌词缓存、以及 Chromium profile（含 localStorage / IndexedDB / cookie）**全部读不到**，表现为「升级后变成新用户」。

**好消息（重要的缩小项）**：**持久化「键名 / 文件名」本身不含 biu，不需要改。**

| 存储 | 键名 | 含 biu？ |
|---|---|---|
| electron-store（`shared/store/index.ts`） | `app-settings` / `user-login-info` / `media-downloads` / `shortcut-settings` / `lyrics-cache` | ❌ 干净 |
| zustand persist | `play-list-store` / `settings` / `favorites-order` / `search-history` / `shortcut-settings` / `user-token` / `user` | ❌ 干净 |
| 裸 localStorage | `play-current-time` | ❌ 干净 |

→ **只要把 userData 目录整个搬过去，数据就完整跟过来，不需要写任何数据改写逻辑。** 这是本方案最大的一个省事点。

**三种处置：**

| 方案 | 做法 | 评价 |
|---|---|---|
| 1. 钉死旧路径 | 启动时 `app.setPath("userData", 旧路径)` | 数据不断，但内部名还是 Biu，治标 |
| 2. 一次性幂等迁移 | 启动早期判断「新目录无数据 && 旧目录存在」→ 整目录拷贝 + 落标记文件保证幂等，配单测 | 有真实老用户时的唯一正解 |
| 3. **不处理** | — | ✅ **本次采用**（理由见下） |

**本次决策：不做迁移代码。** 你的答复是「没有真实用户」，因此不存在「升级后变新用户」的受损对象；此时写迁移代码属于**为不存在的场景增加一条启动期路径**，反而多一个可能出错的环节。README 里给出手动搬目录的指引（§3.4 / README「从上游 Biu 迁移」）即可，等真有用户反馈再补。

**开发态无迁移负担**：`electron/main.ts` 与 `electron/utils.ts` 里的 `biu-dev` 是硬编码字符串，直接改成 `lili-dev` 即可。

### 2.2 授权归属 —— 现状从未做过身份分离

| 位置 | 原值 | 问题 |
|---|---|---|
| `plugins/electron-build.ts:11` | `appId: "com.biu.wood3n"` | 打包身份仍是上游的 |
| `plugins/electron-build.ts:75` | `maintainer: "wood3n"` | 同 |
| `plugins/electron-build.ts:76` | `vendor: "wood3n"` | 同 |
| `plugins/electron-build.ts:77` | `executableName: "Biu"` | 同 |
| `plugins/electron-build.ts:84` | `repo: "biu"`（owner 已是 `Leeero`） | 仓库层已分离，打包层没跟上 |

→ **改名时必须把这一层一并处理**（已处理：`appId` → `com.leeero.lili`、`vendor`/`maintainer` → `Leeero`、`executableName` → `lili`），否则装出来的包对外仍然是上游身份。授权处置三条：

1. LICENSE 原样保留，`Required Notice` 行一字不动（已校验字节一致）；
2. 新增 `NOTICE` 文件 + README「许可证与上游归属」章节，写清：基于 `wood3n/biu`、许可证 PolyForm Noncommercial 1.0.0、非官方二开版、Required Notice 原文；
3. 应用内「设置 → 关于 lili」补上游署名与 Required Notice 原文。

### 2.3 设计保真护栏的连锁冲突 —— 本项目特有，最容易漏

本项目有一整套「按视觉稿重构」的护栏，**它们的 key 就是 `--biu-*` 令牌名**：

| 护栏 | 与改名的耦合 |
|---|---|
| `docs/design/cplus-spec-lock.json` | 自述「本文件是重构的唯一视觉真值」，`meta.name = "Biu 2.0 · C+ 满幅剧场"`，v1.3.34，**304 处 `--biu-`** |
| `tools/design-fidelity/phase-boundary.json` | 阶段基线的 key **就是** `--biu-*` 令牌名；`baselineNote` 里还引用了 `--biu-type-*` 的具体订正记录 |
| `tools/design-fidelity/check-phase-drift.mjs` | 用 `git show <baseline>:src/ui/tokens/**` 与工作区比对令牌声明 |
| `tools/design-fidelity/check-literals.mjs` | 字面值护栏的正则与注释按 `--biu-*` 写 |
| `tests/design-tokens.test.ts:282` | 正则 `/var\(\s*(--(?:c|biu)-[\w-]+)\s*\)/g` |
| `tools/design-fidelity/verify.py` / `extract_reference.py` / `run.sh` | `/tmp/biu-design`、`/tmp/biu-render`、`BIU_FIDELITY_PYTHON` 等路径与环境变量 |

**后果**：只做 `sed --biu- → --lili-`，阶段边界检查会把 368 个令牌全部报成「删除 + 新增」，**护栏直接废掉**；字面值护栏也会失配。

**处置（已落地）**：令牌改名必须**声明式**推进。

1. spec-lock、phase-boundary、check-literals 注释、design-tokens 正则一起改；
2. **在 `check-phase-drift.mjs` 里加前缀归一**，而不是把 368 个旧名写进豁免名单：

   ```js
   const normalizeName = name => name.replace(/^--(?:biu|lili)-/, "--lili-");
   ```

   并在**三处**都套上它——`collectDeclarations`（声明收集）、消费方枚举、以及 **`resolve()` 内部的 `var()` 引用解析**。只归一 map 的 key 而漏掉 `resolve()` 里的引用，会让基线里 `rgb(var(--biu-accent))` 取不到值，误报成 3 处「表达式改写」（这是实施中真实踩到的假阳性）。
3. 重跑 `pnpm verify:phase-drift` / `pnpm verify:literals` / `pnpm test -- tests/design-tokens.test.ts` 共同出口。

**零漂移证明**：用 `git worktree` 在 `HEAD`（改名前的 `9b0e8e4`）建了一份对照工作区，同一个 `check-phase-drift.mjs` 跑两遍，把两边的 `--biu-` / `--lili-` 统一归一成 `--XX-` 后逐字比对，输出**完全一致**。即改名本身产生的漂移是 **0**；脚本报出的 2 条残余偏差（`--lili-topbar-bg` 的 `linear-gradient` 空白差、`--lili-content-max-width` 未声明未消费）在改名**之前就已存在**，属既有基线问题，与本次无关。

---

## 3. 影响面全清单

### 3.1 产品标识与文案（手工，约 30 处）

| 文件 | 内容 |
|---|---|
| `package.json` | `name`、`productName`、`description`、`homepage` / `repository.url` / `bugs.url`、`keywords`、`author` |
| `plugins/electron-build.ts` | `appId` / `productName` / `icon` / `synopsis` / `executableName` / `maintainer` / `vendor` / `publish.owner`+`repo` |
| `electron/main.ts` | dev userData `lili-dev`；`title: isDev ? "lili-dev" : "lili"` |
| `electron/utils.ts` | `lili-dev` |
| `electron/mini-player.ts` | `title: "lili Mini Player"` |
| `electron/windows/shell-menu.ts` | `label: "退出 lili"` ← **有契约测试基线**（`tests/shell-menu.test.ts:115`） |
| `electron/windows/tray.ts` | tooltip `lili - ${title}` / `"lili"` |
| `electron/ipc/download/download-core.ts` | `os.tmpdir()/lili-temp-downloader`、窗口标题 `lili下载-${id}` |
| `src/index.html` | `<title>lili</title>`、meta description |
| `src/pages/settings/index.tsx` | 「管理 lili 的界面、播放与本地应用偏好」 |
| `src/pages/settings/system-settings.tsx` | 「关于 lili」（同时补上游署名） |
| `src/pages/history/index.tsx` | 「不等同于 lili 的听歌统计」 |
| `src/pages/design-system/patterns-exhibit.tsx` | 展位示例文案「lili Music · 63 首」 |
| `src/pages/settings/export-import.tsx` | 导出文件名 `lili-settings-*.json` |
| `src/layout/sidebar/profile-menu.tsx`<br>`src/components/error-fallback/index.tsx` | 反馈链接 `github.com/Leeero/biu/issues` → `github.com/Leeero/lili/issues` |

### 3.2 CSS 令牌与主题命名空间（一条 sed）

| 目标 | 处数 | 备注 |
|---|---|---|
| `--biu-` → `--lili-` | 1665（368 个去重名） | 含 `--biu-4188-*` 548 处；集中在 `src/ui/tokens/geometry.css`(216)、`src/app/shell/shell-4188.css`(108)、`src/ui/tokens/semantic.css`(96) |
| `biu-theme-4188` → `lili-theme-4188` | 73 | 含 `@custom-variant`（`src/app.css`）、5 处 `.biu-theme-4188` 定义、`root.classList.add()`（`src/components/theme/index.tsx`）、Tailwind 前缀用法（`src/ui/patterns/dialog/index.tsx` 30 处） |
| `os-theme-biu` → `os-theme-lili` | 6 | `src/app.css`、`scroll-container`、`search-field`、`tests/app-shell-interactions.test.ts` |
| `BIU_WEB_ONLY` / `BIU_FIDELITY_*` | 若干 | 环境变量属开发约定，一并改并同步 `run.sh`、`README`、CI |

### 3.3 仓库与 CI

- `.github/workflows/pr-test-build.yml` — artifact `name: lili-${{ matrix.os }}`
- `.github/ISSUE_TEMPLATE/bug-report.yml` — 三条日志路径
- `.github/ISSUE_TEMPLATE/config.yml` — discussions URL
- `.github/CODEOWNERS` — 已是 `@Leeero`，**不用动**
- 仓库改名 `Leeero/biu` → `Leeero/lili`（**已落地**）：`package.json` 三处 URL + `publish.owner`/`repo` + `dev-app-update.yml` + README badges + contributors / star-history 链接（`CHANGELOG.md` 历史链接**不动**）

### 3.4 资产与截图（「截图的地方」）

| 资产 | 处置 |
|---|---|
| `screenshots/logo.svg` | 图形本身无 `<text>Biu` 命中，属图形字标 → **需重做图形** |
| `screenshots/`（home / main / playlist / download / fullscreen / mini） | **界面截图含 Biu 字标与窗口标题，必须重截** |
| `audit-2026-09-30/`（6 张 png） | 审计截图，**重截** |
| `electron/icons/macos/biu.icon/` → `lili.icon/` | ✅ 已 git mv；内含 `Assets/logo 2.png` |
| `electron/icons/logo.png` / `win/logo.ico` / `win/dev.ico` | 若图形含 Biu 字标需重做 |
| `electron/icons/macos/trayTemplate.png` + `@2x` | 由 logo 的 alpha 派生纯黑剪影，只跟图形有关，**图形换则重生** |
| `docs/**/*.png`（50 张） | 历史设计稿截图 → **不改**，标注为历史产物 |
| `prototypes/biu-discover-option2/` | **不改**（见 §5） |
| `prototypes/c-plus-2026/`、`prototypes/home-redesign/` | 改品牌字串（见 §5） |

### 3.5 文档：分级处置

**判据一句话：「这份文档是给未来的人当**地图**看的（改），还是给过去的**事作证**用的（不改）」。**

本次按你的「所有涉及原本命名的地方全部调整」口径**从宽处理**：只把带外部 commit 链接的自动发布史（`CHANGELOG.md`）留在原地，其余文档（含阶段验收记录）的名称与内容一律跟随改名。理由是阶段文档正文里引用的 `--biu-type-*` 等令牌名**已经不是当前实现的名字**，留旧名反而是失效引用。

| 级别 | 范围 | 处置 |
|---|---|---|
| **改（活文档）** | `README.md` 全篇；`docs/lili-*.md` 15 个文件名 + 内容 | 已改 |
| **改（护栏/规格）** | `docs/design/cplus-spec-lock.json`、`docs/design-4188/phase1/tokens.json`、`docs/design/cplus-token-bridge.md` 等 | 已改 |
| **不改（历史证据）** | `CHANGELOG.md` 的历史条目、`docs/design/evidence/*.png`、`docs/design-4188/*.png`、`prototypes/biu-discover-option2/` | 逐字不动 |

### 3.6 版本（「版本的地方」）

| 位置 | 原值 | 现值 |
|---|---|---|
| `package.json` | `"version": "1.16.0"`（继承上游版本线） | `2.0.0` |
| `CHANGELOG.md` | `v1.16.0` 段 + `wood3n/biu` 的 compare/commit 链接 | **不改**（顶部加了一段改名说明） |
| `README.md` | 版本 badge | 指向 `Leeero/lili`（版本号在 badge 里不写死） |
| `plugins/electron-build.ts` | `artifactName: ${productName}-${version}-*.${ext}` | 改 productName 后自动变 `lili-...` |

**版本策略（已定）：从 `2.0.0` 重启。**

| 方案 | 评价 |
|---|---|
| **2.0.0 重启 ✅ 采用** | 与「C+ 重构代次 2.0」在叙事上合流：这次改名本就是该代次的产品身份落地，版本号顺势对齐；配合 appId 变更，与旧版本线清晰断开 |
| 1.17.0 | 延续上游版本线，但暗示「还是同一个应用」，与换了 appId 的事实矛盾 |
| ~~1.0.0 重启~~ | 初稿曾选此项（理由：品牌独立、语义最干净），**同日改为 2.0.0**。代价是数字与「重构代次 2.0」重合，需靠术语口径区分（见 §2 术语说明），不能混读 |

**发布链路注意：**

- `publish: "onTag"` + `release.yml` 由 `v*` tag 触发 → 首个改版发 `v2.0.0`
- **appId 变更 = 换了一个应用身份**：老版本 `com.biu.wood3n` **无法自动升级**到新 appId，签名与装机升级路径需重新规划。发版必须在 Release note 与应用内公告里说明「需手动重新下载安装」
- **AUR `biu-bin` 不要动**：它由第三方 `@cjlworld` 维护、指向上游，不属于本仓；要发 Arch 包就另建 `lili-bin`

---

## 4. 执行：与现有重构批次并进，不要分两轮

按项目既有纪律（一次只跑一个重任务、契约测试钉行为、改名要声明式），拆成 4 个提交、同一批推进：

### 提交 1 · `refactor(tokens): CSS 令牌前缀 biu → lili`（`93d988f`）

- `sed` 令牌前缀 + 主题命名空间（§3.2 全部三项）
- **保真护栏联动**（§2.3）：`docs/design/cplus-spec-lock.json`、`phase-boundary.json`、`check-literals.mjs` 注释、`tests/design-tokens.test.ts` 正则、`check-phase-drift.mjs` 的 `normalizeName`
- 附带：eslint `--fix` 因前缀由 6 字符变 7 字符而重排了 3 个文件的换行

### 提交 2 · `feat(brand): 产品标识与打包配置改名 lili`（`a979aa0`）

- §3.1 全部 + §3.3 全部 + `package.json` / `plugins` / `index.html`
- `appId` → `com.leeero.lili` + `vendor` / `maintainer` → `Leeero` + `executableName: "lili"`
- 同步 `tests/shell-menu.test.ts` 的「退出 lili」基线
- `electron/icons/macos/biu.icon` → `lili.icon`（git mv）
- `CHANGELOG.md` 顶部加改名说明（历史条目不动）

### 提交 3 · `chore(rename): 收口运行时路径、开发开关与工具链临时目录`（`2c56547`）

- `biu-dev` → `lili-dev`、`/tmp/biu-*` → `/tmp/lili-*`、`BIU_*` 环境变量 → `LILI_*`
- 保真夹具 JSON（05 / 11 / 12）与 `src/ui/fixtures/*.ts` 对齐

### 提交 4 · `docs: 改名方案与上游授权说明`（本提交）

- 新增 `NOTICE`（含 `Required Notice` 原文）
- README 重写：「上游与授权」章节、产物文件名、AUR 归属说明、从上游迁移指引
- 应用内「关于 lili」补上游署名与 Required Notice
- `docs/biu-*.md` 15 个文件 `git mv` 为 `docs/lili-*.md`

### 机械替换的一键命令（提交 1 / 2 用，执行前先 `git status` 确认干净）

```bash
# 令牌与主题命名空间（提交 1）
grep -rl -- '--biu-' src electron tests | xargs sed -i '' 's/--biu-/--lili-/g'
grep -rl 'biu-theme-4188' src electron tests tools prototypes | xargs sed -i '' 's/biu-theme-4188/lili-theme-4188/g'
grep -rl 'os-theme-biu' src tests | xargs sed -i '' 's/os-theme-biu/os-theme-lili/g'
```

> ⚠️ 两个实测踩过的坑：
> 1. **macOS 的 BSD `grep` 不支持 `\|` 交替**（`grep -rn "biu\|lili"` 会**静默返回空**，看起来像「没命中」）。一律用 `grep -E 'a|b'` 或 `grep -i`。
> 2. **zsh 不对未加引号的参数展开做词拆分**。`sed -i '' ... $FILES` 会把多行文件名当成**一个**文件名，报 `sed: : No such file or directory`。要么 `for f in ...; do ...; done`，要么 `grep -rl ... | while IFS= read -r f; do ...; done`，要么 `xargs`。

---

## 5. 白名单：改名时明确不动的东西

区分「活的实现」和「取证用的冻结快照」是这次改名最需要判断力的地方。以下三类**特意不改**：

| 对象 | 为什么不动 |
|---|---|
| `prototypes/biu-discover-option2/`（42 个跟踪文件） | 它是**哈希锁定**的设计源快照：`docs/design-4188/phase0/source-lock.json` 用 SHA-256 锁了 4 个源文件 + 11 个资产，`changePolicy.onHashChange` 规定「哈希一变就阻塞视觉实现，直到受影响屏重新审计」。目录名本身也是这条 lock 记录的一部分（`sourceRoot`）。改它 = 让 `verify-source-lock.mjs` 失败 + 触发重审流程，且会把「设计真值取自哪里」这段**归属事实**抹掉。目录里出现的 `biu` 是**证据**，不是遗留。 |
| `CHANGELOG.md` 历史条目 | 自动生成的发布史，带 `wood3n/biu` 的 commit / compare 链接。改它 = 篡改上游提交的可追溯性，反而削弱 §0.2 的证据链。 |
| `docs/**/*.png`、`docs/design-4188/*.png`、`docs/design/evidence/*.png` | 历史设计稿截图，是对**改名前状态**的取证。逐字不动。 |

**反过来，这两个原型要改：**

| 对象 | 为什么改 |
|---|---|
| `prototypes/c-plus-2026/` | 它是**保真链路的受检对象之一**（`verify.py:48` 的 `PROTOTYPE_DIR`），与应用一起对着同一份设计稿参考图判定。既然应用里品牌字已改，参考实现不同步就会在品牌处造成真实分叉。已核对：所有探针窗口均从 `x≥64` 起（`TOPBAR_WINDOW = (300, 1200, ...)`），而 `.brand` 在顶栏最左侧 x≈36–100，**落在全部探针之外**，改品牌字对保真判定零影响。 |
| `prototypes/home-redesign/` | 首页视觉稿，同样含 `Biu` 字标与 `alt` 文本，属活文档。 |

---

## 6. 决策已定（原「需要你拍板的 4 件事」）

| # | 问题 | 你的答复 | 落地影响 |
|---|---|---|---|
| 1 | 纯个人非商业，还是商业打算？ | **不含商业** | §0.4 的商业闸门关闭，方案成立；README / NOTICE 写明非商业限制 |
| 2 | 现网是否已有真实用户？ | **没有真实用户** | userData 迁移**不做代码**，只在 README 给手动搬目录指引（§2.1 方案 3） |
| 3 | 版本号走 2.0.0 / 1.17.0 / 1.0.0？ | **2.0.0 重启** | `package.json` → `2.0.0`；首次改版 tag 打 `v2.0.0`；`CHANGELOG.md` 加说明。初稿曾选 `1.0.0`，同日改为 `2.0.0`（与重构代次对齐） |
| 4 | 产品名 / 仓库名？ | **产品名 `lili`；仓库改名为 `lili`（小写）** | `productName: "lili"`、产物名 `lili-<version>-*`；GitHub 仓库 `Leeero/biu` → `Leeero/lili`（实际落地为小写，与 `package.json` 的 `name` 一致）；保留上游署名 |
| 5 | 上游署名怎么处理？ | **保留** | LICENSE 逐字不动；新增 `NOTICE`；README + 关于页补归属 |

---

## 7. 仓库怎么改：直接改当前仓库，不要新建

**结论：在现有仓库上直接改名（Rename），不要新建空仓库再搬代码。**

理由四条：

1. **git 历史就是署名证据链。** 上游许可证只硬性要求那一行 `Required Notice`，但真要主张「这是基于 Biu 的二开」，738 条可逐条追溯的提交比 README 里一句致谢强得多。新建空仓库把代码 `git init` 成一个提交，等于**主动销毁证据**。
2. **改现有仓库是零成本操作，且旧 URL 自动 302。** GitHub 的仓库改名会把旧地址重定向到新地址，克隆、Release 下载链接、Issue 链接都不会断。新建仓库反而要自己维护「旧仓库留着还是归档」的一致性。
3. **「另起仓库能保住上游更新通道」这条常见理由在本项目不成立。** 上游自 2026-01-20 起已停更 9 个月，fork 点**就是**上游尖端，没有更新可切；保留历史的唯一价值就是归属证据，更不该丢。
4. **仓库名只影响 GitHub 层，与打包身份是两件事。** 真正决定「装了哪个应用」的是 `appId`（已改为 `com.leeero.lili`），仓库名不影响装机升级路径。

**执行结果（已完成，2026-10-10）：**

1. ✅ 仓库已在 GitHub 网页改名为 **`Leeero/lili`**（小写；旧地址 `github.com/Leeero/biu` 自动 302）。
   - 改名前该仓库是 fork，改名**未破坏** fork 网络，上游关系自动保留。
   - 大小写口径：最终定为**小写 `lili`**，与 `package.json` 的 `name: "lili"`、`productName: "lili"`、产物名 `lili-<version>-*` 全部对齐（GitHub 仓库名大小写不敏感，但显示名统一更干净）。
2. ✅ 本地 remote 已更新并实测可达：

   ```bash
   git remote set-url origin https://github.com/Leeero/lili.git
   git remote -v            # origin  https://github.com/Leeero/lili.git (fetch/push)
   git ls-remote --heads origin   # 返回 refs/heads/master，连通正常
   ```
3. **本地目录名仍叫 `biu`，不影响任何东西**，不必改（改了反而要动所有脚本里的绝对路径）。
4. 仓库名口径已随本次提交落到代码与配置：`package.json` 三处 URL、`plugins/electron-build.ts` 的 `publish.owner` + `repo: "lili"`、`electron/updater/dev-app-update.yml` 的 `repo: lili`、`.github/ISSUE_TEMPLATE/config.yml` 的 discussions URL、`src` 两处反馈链接、README 的 badges / contributors / star-history 链接。
5. **不要动** `CHANGELOG.md` 里指向 `wood3n/biu` 的历史链接（自动发布的既有事实）。

> 注意：上游 feed 的 `publish.repo` 与 `dev-app-update.yml` 必须与新仓库名一致——自动更新不认「重定向语义之外」的路径变化，这一层若不同步会直接导致更新检查失败。

---

## 8. 执行状态与验证清单

**已完成：** 提交 `93d988f`（令牌）、`a979aa0`（品牌与打包）、`2c56547`（运行时路径）、`054b917`（文档与授权）、`bb9bee7`（仓库名口径收口）、`621018a`/`9c985a4`（截图）、`b2a0d34`（版本号 2.0.0）。

- [x] `pnpm verify:phase-drift` — 改名与改版本号后均 **0 新增漂移**（用 `git worktree` 对照逐字证明，§2.3）
- [x] `pnpm verify:literals` — 通过（扫描 388 文件）
- [x] `verify-tokens.mjs` — `ok: true`（`contract.scope` 已改为 `.lili-theme-4188`）
- [x] `verify-source-lock.mjs` — `ok: true`，15 个哈希全对，机器侧证明「不重命名 `prototypes/biu-discover-option2`」是正确判断
- [x] **受影响契约测试全绿（6 个文件 / 303 项）**：`design-tokens`(197)、`app-shell-interactions`(46)、`ui-components`(34)、`discover-list-view`(13)、`electron-security`(7)、`shell-menu`(6)——这 6 个就是全部引用 `lili` 的测试文件，构成「受改名影响的测试」的完备边界（含 `biu` 字面量的测试必然是这 6 个之一，已随改名一并改到 `lili`）
- [x] 全仓 `grep -riE 'biu'` 收敛到 §5 白名单
- [x] **GitHub 仓库已改名为 `Leeero/lili`**，本地 remote 同步并 `git ls-remote` 实测可达
- [x] **「Required Notice」四处逐字一致**（SHA-256 `de0a06c4d667` 同值）：`LICENSE` / `NOTICE` / `README` / 应用内关于页
- [x] **截图全部重截**：`screenshots/` 6 张已换为 4188 壳 + lili 品牌（`621018a`、`9c985a4`）；`logo.svg` 与 `electron/icons/**` 实测为纯图形**无字标**，不需重做；`audit-2026-09-30/` 作为历史审计证据**有意保留**
- [x] 「退出 lili」菜单文案已改并由契约测试钉住（`tests/shell-menu.test.ts` 通过；**运行期目视仍待打包实测**）
- [ ] **完整构建未验证** ⚠️ 改名后 `LILI_WEB_ONLY=1 pnpm build` 在本机连续两次 `write EPIPE`（tailwind 子进程被资源守卫杀），基线 worktree 复验也 exit 137 —— 属**环境限制而非代码回归**，但「改名后能构建出完整产物」这件事**至今没有正面证据**。打包实测会一并回答它
- [ ] **CI 从未跑过** ⚠️ `Leeero/lili` 的 GitHub Actions 运行记录为 **0 条**（改名后都是直推 master，而 `pr-test-build.yml` 只在 PR 上触发）。`release.yml` 在 tag 上会跑 `pnpm test -- --run`（**全量**）+ `pnpm build` —— 也就是说**首次 CI 就是发版那一次**，全量测试与完整构建会在那时第一次合并受检。**已有安全的空跑通道**：`release.yml` 带 `workflow_dispatch`，且其 `publish-release` 作业有 `if: startsWith(github.ref, 'refs/tags/v')` 守卫 —— **手动 dispatch 只跑 build 作业（三平台全量测试 + 完整构建），不会创建或改动 Release**
- [ ] 打包实测：产物名 `lili-2.0.0-*`、应用显示名 `lili`、userData 目录为 `lili`、菜单栏/托盘文案运行期目视
- [ ] 新 appId 下 GitHub Releases 自动更新能拉到新版本（依赖 `publish.repo` / `dev-app-update.yml` 已同步为新仓库名）
- [ ] 首个 `v2.0.0` tag 发版，Release note 写明「与上游 Biu 非同一应用，需手动下载安装」

### 下一步（建议顺序，理由见下）

在动 tag 之前，先把两个「从未正面验证过」的环节挪到台前——它们现在是全部剩余风险所在，且都被发版流程依赖。

| # | 动作 | 为什么排这个位置 |
|---|---|---|
| 1 | **本地跑一次 `pnpm build`**（正常终端，非本工具的沙箱） | 一次动作同时回答三件事：改名后能否构建、产物名是否为 `lili-2.0.0-*`、`electron-builder` 的 `productName` 是否落地。**这是当前唯一没有任何正面证据的环节** |
| 2 | **让 CI 先空跑一次**：GitHub → Actions → **Release** → `Run workflow`（分支选 `master`） | CI 至今 0 运行。全量测试（48 个文件，我只逐文件验了受影响的那 6 个）与完整构建会在 tag 上**第一次**受检；万一有非改名原因的红灯，不应发生在发版那一刻。**这条通道是安全的**：`publish-release` 作业有 `if: startsWith(github.ref, 'refs/tags/v')` 守卫，手动 dispatch 时 ref 是分支、不满足条件 → **只跑 build 作业，不碰 Release**（顺带比 PR 路线更省事：`pr-test-build.yml` 有 paths-filter，纯文档 PR 会走「No Build」分支而跳过构建，反而验不到） |
| 3 | 起打包产物目视：显示名 `lili`、userData 目录 `lili`、菜单栏/托盘「退出 lili」 | `shell-menu` 契约测试已钉文案，但**运行期观感**测不到 |
| 4 | 打 `v2.0.0` tag 发版（`pnpm release`） | 前 3 步绿了再打。Release note 必写「与上游 Biu 非同一应用，无自动升级路径，需手动下载安装」 |
| 5 | 发版后验自动更新拉取 | 依赖 `publish.repo` / `dev-app-update.yml` 已同步为 `lili`，但真拉取要等有下一个版本才能验 |

**可选、非阻塞**：`fullscreen.jpg` 换一首有歌词的歌重拍（现有图是「暂未匹配到歌词」空态），观感更好；不影响任何验收项。

---

## 附：本次改名沉淀下来的两条纪律

1. **改名要「声明式」，不要在护栏上开豁免口子。** 令牌名同时是保真基线的 key，正确做法是让护栏理解「`--biu-` 与 `--lili-` 是同一身份」（前缀归一），而不是把 368 个旧名写进豁免名单——后者一旦开了口子，真漂移会被淹掉。
2. **先分清「活实现」与「冻结快照」，再动手。** 同一个 `prototypes/` 目录下，`biu-discover-option2` 是哈希锁定的取证快照（不动），`c-plus-2026` 是保真链路的受检对象（要跟着改）。用「这个 `biu` 是**当前的名字**还是**当时的证据**」来分，比按目录一刀切可靠。
