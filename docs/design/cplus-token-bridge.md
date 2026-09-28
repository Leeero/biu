# C+ 令牌桥接表

> 用途：把视觉稿的字面值翻译成项目可用的三层令牌。**唯一允许出现字面色值的文件是 `src/ui/tokens/palette.css`**，其余任何地方（含组件 className）只能引用语义令牌。
>
> 真值来源：[`cplus-spec-lock.json`](./cplus-spec-lock.json)　原型：[`prototypes/c-plus-2026/assets/tokens.css`](../../prototypes/c-plus-2026/assets/tokens.css)

## 修订记录

| 版本 | 阶段 | 变更 |
| --- | --- | --- |
| 1.3.0 | P3–P4 | §3 排版映射与真值对齐：`--fs-lead` 由原型的 `22px` 订正为设计实测 **20px**；补录 1.3.24 / 1.3.25 新立的四档（`listTitle` 17 / `sectionTitle` 16 / `note` 14 / `chrome` 14）。这四档在原型里没有对应令牌（或借用了别的档），旧表因此整片缺失 —— 表里现在用 `⚠` 与「新立」标出所有与原型不同的行。 |
| 1.2.0 | P0 | ① 补录 `material.scrimVeil.stops`：遮罩渐隐的四个停止点原先只写在 `rule` 自由文本里，无法被断言。② 测试新增「登记即断言」完备性校验：真值中任何 `token` / `borderToken` / `tokens.*` 都必须被某条断言覆盖，否则失败 —— 此前存在登记未断言的静默缺口（`--biu-radius-image` / `--biu-radius-window` / `--biu-scrim` / `--biu-scrim-veil`）。③ 补齐上述四条的取值断言。 |
| 1.1.0 | P0 | ① 修正 §1.7 沉浸态背景：原表记录的是**拟合前的中间参数**，与原型实现不一致，已同步为原型现值。② 补录原型实际使用但未登记的合成色（反色对、强调药丸文字、弱化文字、底板环境光、顶栏渐变停止点）。③ 排版令牌 `--biu-text-<role>` → `--biu-type-<role>`，消除与文字颜色令牌 `--biu-text-primary` 的同前缀歧义。④ §7 护栏细化为「字面色值仅限 palette.css，`--c-` 引用仅限 semantic.css」。⑤ 明确占位封面渐变属数据夹具，不进色板。 |
| 1.0.0 | — | 首版，随重构方案一并冻结。 |

## 0. 三层结构与强制边界

```text
palette.css      原始色板        --c-*        唯一允许字面色值
     ↓ var()
semantic.css     语义令牌        --biu-*      唯一允许被业务代码引用
     ↓ var() / Tailwind arbitrary value
业务组件                        Tailwind     只允许 var(--biu-*)
```

| 层       | 文件                         | 允许引用       | 禁止                                    |
| -------- | ---------------------------- | -------------- | --------------------------------------- |
| 原始色板 | `src/ui/tokens/palette.css`  | 字面色值       | 被业务代码直接引用                      |
| 语义令牌 | `src/ui/tokens/semantic.css` | `var(--c-*)`   | 字面色值、引用其它 `--biu-*` 以外的变量 |
| 几何令牌 | `src/ui/tokens/geometry.css` | 字面长度       | 色值                                    |
| 业务代码 | `src/**`                     | `var(--biu-*)` | 任何 `#hex` / `rgb()` / `hsl()` 字面值  |

**与现状的差异**：现有 `--biu-color-*` 采用「RGB 三通道」写法（`248 248 250`）以支持 Tailwind 透明度修饰符。C+ 同时存在 hex 与 `rgba()` 白透明度两类值，因此新令牌按用途分流：

- **不透明色**（底板、文字）→ 保留三通道写法，便于 `rgb(var(--biu-surface-canvas) / 0.88)` 这类叠加。
- **透明表面**（玻璃、悬停、描边）→ 直接用 `rgba()` 整值，因为它们本身就是透明叠加层，不再需要二次调透明度。

## 1. 色彩映射

### 1.1 表面与底板（三通道）

| 原型令牌        | 语义令牌               | 值（三通道） | 换算      | 用途     |
| --------------- | ---------------------- | ------------ | --------- | -------- |
| `--c-image-bed` | `--biu-surface-image`  | `0 0 0`      | `#000000` | 影像底   |
| `--c-app-bg`    | `--biu-surface-canvas` | `8 8 10`     | `#08080A` | 应用底板 |
| `--c-topbar`    | `--biu-surface-topbar` | `22 22 24`   | `#161618` | 顶栏底   |
| `--c-playbar`   | `--biu-surface-player` | `14 14 17`   | `#0E0E11` | 播放栏底 |

顶栏与播放栏照原型使用合成渐变，不直接用纯色（停止点 0% / 46% / 100%）：

```css
--biu-topbar-bg: linear-gradient(to bottom, var(--c-topbar-top) 0%, var(--c-topbar) 46%, var(--c-topbar-bottom) 100%);
```

底板同样不是纯色，而是两层极弱环境光叠在 `--c-app-bg` 之上：

```css
--biu-app-bg:
  radial-gradient(120% 90% at 12% 0%, var(--c-app-sheen-a), transparent 58%),
  radial-gradient(110% 80% at 92% 100%, var(--c-app-sheen-b), transparent 62%), var(--c-app-bg);
```

### 1.2 文字（三通道）

| 原型令牌     | 语义令牌                | 三通道        | 换算      | 用途          | 对底板对比度           |
| ------------ | ----------------------- | ------------- | --------- | ------------- | ---------------------- |
| `--c-text`   | `--biu-text-primary`    | `255 255 255` | `#FFFFFF` | 主文字        | 20.01 : 1              |
| `--c-text-2` | `--biu-text-secondary`  | `204 204 204` | `#CCCCCC` | 次文字        | 12.46 : 1              |
| `--c-text-3` | `--biu-text-tertiary`   | `161 161 166` | `#A1A1A6` | 三级文字      | 7.78 : 1               |
| `--c-text-4` | `--biu-text-quaternary` | `142 142 147` | `#8E8E93` | 注解带        | 6.14 : 1               |
| `--c-text-5` | `--biu-text-disabled`   | `110 110 115` | `#6E6E73` | 禁用 / 弱标注 | 3.95 : 1（仅限非正文） |

> 对比度按 WCAG 相对亮度公式对 `--biu-surface-canvas`（`#08080A`）计算，并已写入 `cplus-spec-lock.json` 的 `palette.*.contrastOnCanvas`，由 `tests/design-tokens.test.ts` 校验（容差 ±0.05）。前四档 ≥ 4.5 : 1，可直接用于正文；`text-disabled` 低于 AA，只允许用于非关键标注。
>
> **P0 勘误**：本表 1.0.0 版记的是 18.9 / 12.1 / 7.5 / 5.9 / 3.6 —— 那是照上一轮暗底 `#121214` 算的。C+ 底板改为 `#08080A` 后整体提升，已重算。

另有两个**整值**文字令牌（不接受二次调透明度，直接 `var(...)`）：

| 原型令牌 | 语义令牌                 | 值                       | 用途         |
| -------- | ------------------------ | ------------------------ | ------------ |
| —        | `--biu-text-placeholder` | `rgba(255,255,255,0.42)` | 输入框占位符 |
| —        | `--biu-text-lyrics-dim`  | `rgba(255,255,255,0.56)` | 非当前行歌词 |

反色对用于激活药丸、主操作与播放键：`--biu-inverse-surface`（`#F2F2F2`）+ `--biu-inverse-ink`（`#0A0A0C`，对比度 17.67 : 1），悬停态为 `--biu-inverse-surface-hover`（`#E8E8EA`）。已生效的筛选条件用 `--biu-accent-soft`（`rgba(41,151,255,0.22)`）+ `--biu-accent-ink`（`#7CBCFF`）。

### 1.3 强调与能力色（三通道）

| 原型令牌                 | 语义令牌        | 三通道        | 换算      | 用途                               |
| ------------------------ | --------------- | ------------- | --------- | ---------------------------------- |
| `--c-accent` / `--c-dir` | `--biu-accent`  | `41 151 255`  | `#2997FF` | 强调、本地目录徽标、注解标记、进度 |
| `--c-quality`            | `--biu-quality` | `90 180 255`  | `#5AB4FF` | 音质徽标                           |
| `--c-danger`             | `--biu-danger`  | `255 107 107` | `#FF6B6B` | 危险操作                           |
| `--c-film`               | `--biu-film`    | `210 210 215` | `#D2D2D7` | 胶片灰                             |

品牌色收敛：`--biu-color-brand` 由 `hsl(var(--heroui-primary))` 改为固定 `var(--biu-accent)`。用户自定义主色入口随主题收敛一并移除（决策 2）。

### 1.4 本地格式色（三通道）

| 格式 | 原型令牌       | 语义令牌         | 换算      |
| ---- | -------------- | ---------------- | --------- |
| FLAC | `--c-fmt-flac` | `--biu-fmt-flac` | `#5AB4FF` |
| WAV  | `--c-fmt-wav`  | `--biu-fmt-wav`  | `#7ED8A8` |
| AIFF | `--c-fmt-aiff` | `--biu-fmt-aiff` | `#E5C07B` |
| M4A  | `--c-fmt-m4a`  | `--biu-fmt-m4a`  | `#B99BE8` |
| MP3  | `--c-fmt-mp3`  | `--biu-fmt-mp3`  | `#C8C8CE` |
| WMA  | `--c-fmt-wma`  | `--biu-fmt-wma`  | `#C8C8CE` |

> AIFF 修正记录：原实现写 `#e05c07`，设计稿原文为 `#E5C07B`，以设计稿为准。

### 1.5 透明表面与描边（rgba 整值）

| 原型令牌           | 语义令牌                     | 值                       | 用途            |
| ------------------ | ---------------------------- | ------------------------ | --------------- |
| `--glass`          | `--biu-surface-glass`        | `rgba(255,255,255,0.16)` | 玻璃圆片底      |
| `--glass-strong`   | `--biu-surface-glass-strong` | `rgba(255,255,255,0.24)` | 玻璃按下态      |
| `--surface`        | `--biu-surface-raised`       | `rgba(255,255,255,0.06)` | 抬升面板        |
| `--surface-hover`  | `--biu-surface-hover`        | `rgba(255,255,255,0.10)` | 悬停            |
| `--surface-sunken` | `--biu-surface-sunken`       | `rgba(255,255,255,0.13)` | 凹槽 / 歌词面板 |
| `--surface-field`  | `--biu-surface-field`        | `rgba(255,255,255,0.17)` | 输入框          |
| `--line`           | `--biu-border`               | `rgba(255,255,255,0.10)` | 标准描边        |
| `--line-weak`      | `--biu-border-weak`          | `rgba(255,255,255,0.06)` | 弱分隔          |
| `--line-strong`    | `--biu-border-strong`        | `rgba(255,255,255,0.16)` | 强调描边        |

### 1.6 遮罩

| 原型令牌 | 语义令牌 | 值 |
| --- | --- | --- |
| `--scrim` | `--biu-scrim` | `rgba(0,0,0,0.26)` |
| `--scrim-veil` | `--biu-scrim-veil` | `linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.62) 38%, rgba(0,0,0,.26) 72%, rgba(0,0,0,0) 100%)` |

> 遮罩规则：只用于可读性（压在影像上的文字），统一 26% + 底部渐隐，`UI 里不得作为装饰使用`。

### 1.7 沉浸态背景

设计稿实测结论：**右上与右下是纯暗底（`#06060B` 级），不存在右下蓝光**。真实结构是左缘竖向紫雾（峰值 y≈43%）+ 顶部横向冷蓝雾。数值拟合（14 个采样点，平均色差 6.27 → 1.65）得到：

```css
--biu-immersive-bg:
  radial-gradient(20% 22% at 0% 0%, var(--c-immersive-haze-a), transparent 64%),
  radial-gradient(21% 73% at 0% 43%, var(--c-immersive-haze-b), transparent 77%),
  radial-gradient(97% 54% at 33% 6%, var(--c-immersive-haze-c), transparent 84%), var(--c-immersive-base);
```

> **P0 勘误**：本表 1.0.0 版曾记录 `rgba(74,92,182,.46) / rgba(104,62,156,.55) / rgba(48,36,96,.52)` 三值并多出一条 `60% 30% at 15% -4%` 的层——那是拟合**之前**的中间参数，与原型实现不符。现已按原型现值校正（`rgba(30,114,166,.49) / rgba(108,78,158,.47) / rgba(55,49,90,.6)`）。这正是「真值必须与实现同源」的必要性所在：文档一旦与实现分叉，后续所有屏都会照着错的抄。

复刻时**不得凭直觉改成「右下蓝光」或「中心聚光」**。若视觉上仍有疑虑，以 `verify.py --screen 10-now-playing` 的采样色差为准。

## 2. 圆角映射

| 原型令牌                 | 语义令牌              | 值      | 用途                   |
| ------------------------ | --------------------- | ------- | ---------------------- |
| `--r-image`              | `--biu-radius-image`  | `0px`   | 满幅影像               |
| `--r-chip`               | `--biu-radius-sm`     | `8px`   | 药丸内片 / 角标        |
| `--r-tile`               | `--biu-radius-md`     | `12px`  | 瓦片、缩略图、迷你窗口 |
| `--r-panel`              | `--biu-radius-lg`     | `20px`  | 面板、歌词、弹层       |
| `--r-window`             | `--biu-radius-window` | `12px`  | 迷你播放器窗口         |
| `--r-pill` / `--r-field` | `--biu-radius-pill`   | `999px` | 药丸、搜索框、播放键   |

现有 `--biu-radius-sm/md/lg/xl` 由 `calc(var(--heroui-radius-medium) ± n)` 派生，随用户圆角设置变化。**收敛后改为固定值** —— 设计稿明确「0 满幅影像 / 999 圆片，界面里没有直角卡片」，圆角不是可调项。

## 3. 排版映射

> 前缀是 `--biu-type-`，不是 `--biu-text-`。`--biu-text-primary` 一类是**文字颜色**（第 1.2 节），两者混用同前缀会造成不可读的代码，故 P0 统一改名。
>
> 每个字阶声明四个原子令牌 `--biu-type-<role>-size / -weight / -leading / -tracking`，另有一个由四者拼出的 `font` 简写 `--biu-type-<role>`。原子令牌是唯一真值。

| 原型令牌 | 角色 | 原子令牌 | 值 |
| --- | --- | --- | --- |
| `--font` | 西文字族 | `--biu-font-sans` | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif` |
| `--font-num` | 数字字族 | `--biu-font-numeric` | `"SF Pro Display", -apple-system, "Helvetica Neue", sans-serif` |
| `--fs-page-title` / `--fw-page-title` / `--lh-page-title` | 满幅标题 | `--biu-type-page-title-*` | `56px / 600 / 1.16 / -1px` |
| `--fs-track-title` / `--fw-track-title` / `--lh-track-title` | 曲名 | `--biu-type-track-title-*` | `40px / 600 / 1.2 / -0.8px` |
| `--fs-lead` | 页面副标题 | `--biu-type-lead-*` | `20px / 400 / 1.4` ⚠ |
| `--fs-small` / `--lh-small` | 歌词与浮层小字 | `--biu-type-small-*` | `17px / 400 / 1.62` |
| `--fs-body`（`.track-name` 借） | 曲目表标题 | `--biu-type-list-title-*` | `17px / 600 / 1` ⚠ 新立 |
| `--fs-small`（`Section` 的 h2 借） | 分组标题 | `--biu-type-section-title-*` | `16px / 600 / 1.5` ⚠ 新立 |
| `--fs-body` | 列表正文与元信息 | `--biu-type-body-*` | `15px / 400 / 1.33` |
| （无） | 顶栏 chrome 文字 | `--biu-type-chrome-*` | `14px / 400 / 1.33` ⚠ 新立 |
| `--fs-label`（`.note` 借） | 注解带 | `--biu-type-note-*` | `14px / 400 / 1.43` ⚠ 新立 |
| `--fs-label` | 标签与徽标 | `--biu-type-label-*` | `13px / 400 / 1.6` |
| `--fs-micro` | 表头与角标 | `--biu-type-micro-*` | `12px / 400 / 1.33` |

> **读法**：标 `⚠` 的行与原型的取值**不同**，标「新立」的行**在原型里没有对应令牌**（或借了别的档）。
> 两者都属「原型—设计稿分歧」，真值里逐条带 `divergence` 字段，处置纪律是**档位按角色立、
> 不为省一个令牌让两处角色共用一个数**。原型值只是起点，不是验收线 —— 这里写的是**设计稿实测值**。
> `--fs-lead` 的 22px 是原型自述的「派生字号（按 1.15 阶梯收敛）」，设计稿实测 **20.0**，跨十页一致（1.3.24）。

用法：

```css
/* 整段 */
.track-title {
  font: var(--biu-type-track-title) / var(--biu-type-track-title-leading) var(--biu-font-sans);
  letter-spacing: var(--biu-type-track-title-tracking);
}

/* 或只取一个原子 */
.meta {
  font-size: var(--biu-type-body-size);
}
```

数字（时长、进度、计数）统一开启 `font-variant-numeric: tabular-nums`，字体族用 `--biu-font-numeric`。

## 4. 几何映射

| 原型令牌 | 语义令牌 | 值 | 说明 |
| --- | --- | --- | --- |
| `--stage-w` / `--stage-h` | `--biu-layout-stage-w/h` | `1440px / 900px` | 设计基准。**不作为运行期缩放**，仅作为验收基准尺寸 |
| `--topbar-h` | `--biu-layout-topbar-h` | `71px` | 硬锚点 |
| `--playbar-h` | `--biu-layout-player-h` | `88px` | 硬锚点 |
| `--gutter` | `--biu-layout-gutter` | `64px` | 内容左右最小留白 |
| `--row-h` | `--biu-layout-row-h` | `68px` | 列表行高 |
| `--art-w` / `--art-h` | `--biu-layout-art-w/h` | `100px / 56px` | 行内缩略图（16:9） |
| `--track-gap` | `--biu-layout-track-gap` | `31px` | 图 → 文间距 |
| `--col4` | `--biu-layout-col-4` | `220px` | 第四列（来源 / 状态） |
| `--col5` | `--biu-layout-col-5` | `152px` | 第五列（时长，右对齐） |
| `--list-pad-r` | `--biu-layout-list-pad-r` | `40px` | 列表右缩进 |
| `--blur-glass` | `--biu-blur-glass` | `20px` | 背景模糊 |

现有 `--biu-topbar-height: 64px`、`--biu-player-height: 84px`、`--biu-sidebar-width: 220px`、`--biu-content-max-width: 1440px`：

- 顶栏 64 → **71**；播放栏 84 → **88**。
- `--biu-sidebar-width` **删除**（侧栏移除，决策 3）。
- `--biu-content-max-width` 由 1440 改为 **none**：设计稿是满幅剧场，内容不居中收窄；左右留白靠 `--biu-layout-gutter` 保证。

间距 `--biu-space-*` 现有 4/8/12/16/20/24/32/40，补齐 `48` 与 `64`，与原型 `--sp-1…--sp-16` 对齐。

## 5. 层级与动效映射

| 原型令牌         | 语义令牌                                        | 值                                         |
| ---------------- | ----------------------------------------------- | ------------------------------------------ |
| `--z-content`    | `--biu-z-content`                               | `1`                                        |
| `--z-note`       | `--biu-z-note`                                  | `20`                                       |
| `--z-playbar`    | `--biu-z-player`                                | `40`                                       |
| `--z-topbar`     | `--biu-z-topbar`                                | `50`                                       |
| `--ease-fast`    | `--biu-duration-fast` / `--biu-ease-standard`   | `120ms` / `cubic-bezier(0.32, 0.72, 0, 1)` |
| `--ease-base`    | `--biu-duration-normal` / `--biu-ease-standard` | `180ms` / 同上                             |
| `--ease-overlay` | `--biu-duration-slow` / `--biu-ease-emphasized` | `240ms` / 同上                             |

原型缓动为 `cubic-bezier(0.32, 0.72, 0, 1)`，现有为 `cubic-bezier(0.2, 0, 0, 1)` —— **以原型为准**。

`prefers-reduced-motion: reduce` 下三档时长归零，该规则现已存在，保留。

## 6. 逐屏校正变量（不进令牌层，进组件层）

原型 `app.css` 尾部有一组**逐屏微调**，它们不是设计令牌，而是「同一设计语言在不同内容高度下的边界情形」。重构时**不要**把它们做成全局改色改尺寸的开关，而应表达为组件受控属性：

| 原型类 | 语义 | 目标表达 |
| --- | --- | --- |
| `.page-lead--low` | 导语低 6px | `<PageHeader leadOffset="low">` |
| `.head-main--flat` | 标题列去掉错位基线 | `<PageHeader baseline="flat">` |
| `.filterbar--tight / --loose` | 筛选条与导语间距 12 / 24 | `<FilterBar gap="tight \| base \| loose">` |
| `.section--tight / --push` | 分组间距 12 / 23 | `<Section gap="tight \| base \| push">` |
| `.note--low/-lower/-lowest/-high/-footer/-inline` | 注解带 6 个位置 | `<AnnotationBand anchor="low\|lower\|lowest\|high\|footer\|inline">` |
| `.tracklist--download/--settings/--mini/--search` | 列定义差异 | `<TrackTable columns={...}>` |
| `.page-head--narrow` | 右侧面板 320px | `<PageHeader aside={<InfoPanel/>} asideWidth={320}>` |

映射关系与逐屏取值见 [`cplus-screen-matrix.md`](./cplus-screen-matrix.md)。

## 7. 护栏

由 `node tools/design-fidelity/check-literals.mjs` 与 `tests/design-tokens.test.ts` 两条独立通道强制，二者已接入 CI（`.github/workflows/pr-test-build.yml`）。

| # | 规则 | 强制方式 | 判定 |
| --- | --- | --- | --- |
| 1 | 字面色值只允许出现在 `src/ui/tokens/palette.css` | `check-literals.mjs` | 其余 `src/**` 出现 `#RRGGBB` / `rgb(` / `hsl(` / `oklch(` 即失败。白名单仅限 `rgba(255,255,255,0)`、`transparent`、`currentColor`、`inherit`，以及 `rgb(var(--biu-*))` 这类**不含字面数值**的令牌调用 |
| 2 | 原始色板只允许被 `src/ui/tokens/semantic.css` 引用 | `check-literals.mjs` | 其余文件出现 `var(--c-` 即失败 |
| 3 | 禁止回退 HeroUI 主题色 | `check-literals.mjs` | 出现 `var(--heroui-*` 即失败，`palette.css` 与 HeroUI 适配层除外 |
| 4 | 令牌值不得偏离真值 | `tests/design-tokens.test.ts` | 解析 `cplus-spec-lock.json` 的 `palette` / `typography` / `geometry` / `material`，按 `tokenMap` 逐项断言到 CSS 令牌，任一漂移即失败 |
| 5 | 令牌引用必须可解析 | `tests/design-tokens.test.ts` | `var(--biu-*)` 的引用链必须终止于 `palette.css` 的字面值；出现悬空引用即失败 |

**存量违规**：`check-literals.mjs` 内置 `LEGACY_ALLOWLIST`，登记了 30 处本轮之前既有的字面色值并标注清理阶段。该表**只减不增**——任何新增违规一律直接失败。清单同时是各阶段的清理待办。

**关于「文档与实现同源」**：P0 落地时发现 `cplus-token-bridge.md` 1.0.0 记录的沉浸态背景渐变是拟合前的中间参数，与原型实现分叉。这类错误不会被任何测试抓到，因此规定：**令牌的真值以 `cplus-spec-lock.json` 为准，而 `cplus-spec-lock.json` 的每条值必须能追溯到设计稿实测或原型现值**——`origin` 字段就是这条追溯链，取值只能是「设计稿原文 / 设计稿实测 / 原型实测 / 派生 / 补充能力色」。
