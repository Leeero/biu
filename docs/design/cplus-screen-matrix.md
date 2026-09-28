# C+ 逐屏施工矩阵

> 12 屏的施工契约。每屏开工前读这一行，收工时逐项打勾。数值真值在 [`cplus-spec-lock.json`](./cplus-spec-lock.json)，本文只写**怎么改**与**怎么算做完**。
>
> 状态图例：`待开工` → `施工中` → `保真达标` → `已切换路由` → `旧实现已删除`

## 0. 总表

| # | 设计页 | 屏名 | 目标路由 | 现状载体 | 形态变化 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 2 | 我的音乐库 | `/library` | `pages/library` + `features/library/model` | 卡片列表 → 满幅瓦片库 | 已验收 |
| 02 | 3 | 我的收藏 · 详情 | `/collection/:id` | `features/playlist/playlist-detail.tsx`、`pages/video-collection` | 统一壳层，去三分支 | 已验收 |
| 03 | 4 | 稍后播放 | `/later` | `pages/later` | 视觉重写 | 待开工 |
| 04 | 5 | 本地音乐 | `/local-music` | `pages/local-music` | 增加格式卡网格 | 待开工 |
| 05 | 6 | 下载管理 | `/download-list` | `pages/download-list` | 视觉重写 + 内联进度条 | 待开工 |
| 06 | 7 | 搜索结果 | `/search` | `pages/search` | 大搜索框 + 双 Tab | 已验收 |
| 07 | 8 | 发现音乐 · 卡片 | `/` | `pages/music-recommend` | 默认卡片态 | 已验收 |
| 08 | 9 | 发现音乐 · 列表 | `/` | `pages/music-recommend` | 同页视图切换 | 已验收 |
| 09 | 10 | 播放队列 | `/queue` | `components/music-playlist-drawer` | **抽屉 → 路由页** | 待开工 |
| 10 | 11 | 正在播放 · 沉浸 | `/now-playing` | `components/full-screen-player` | **弹层 → 沉浸态路由** | 待开工 |
| 11 | 12 | 设置 | `/settings` | `pages/settings` | 视觉重写 | 待开工 |
| 12 | 13 | 迷你播放器与系统集成 | `/mini-player` | `pages/mini-player` | 视觉重写 | 待开工 |

**状态口径**：`待开工` = 尚未按设计稿改造；`已验收` = `bash tools/design-fidelity/run.sh --screen <no> --target app` 通过（判定权只在这一侧 —— `--target prototype` 比的是本轮之前的旧原型，它是**起点**不是验收线，见 `tools/design-fidelity/README.md`「原型基线」）。**本列此前 12 行一律写着「待开工」，是未维护的样板值**；1.3.21 按实际验收结果订正了 01 / 02 / 06 / 07 四行，1.3.24 订正了 08。逐屏的验收值与遗留欠账以 `.workbuddy/memory/MEMORY.md` 与 `cplus-spec-lock.json` 的 `meta.revisions` 为准。

**⚠ 一处跨屏欠账（1.3.24 发现，尚未处理）**：`typography.scale` 的三档字号此前是原型的**派生值**而非实测值，1.3.24 已按设计稿订正 **导语 20 / 段标题 16 / 注解带 14**。但同一份「最长等步进段」测量里还有两档**只做了单页取证、未做跨页复核**，且它们的屏尚未开工：`body`（15px）与 `micro`（12px，表头与角标）。下一屏（03 稍后播放 / 04 本地音乐）开工时**先把这两档量一遍**，不要等到全部 12 屏做完再回头 —— 那会变成一次全屏返工。

**路由变化汇总**：新增 `/queue`、`/now-playing`；`/` 的默认视图由列表改为卡片；其余路径不变（保持外部链接与书签兼容）。

---

## 01 · 我的音乐库　`/library`

- **设计页**：2　**原型**：`screens/01-library.html`　**可滚动**
- **现状**：`pages/library/index.tsx` 用 `PlaylistCard` 网格展示「我创建的 / 我收藏的」，靠 `useFavoritesStore` 拉取。

**复刻要点**

1. 页头为两栏 `PageHeader`：左列 H1「我的音乐库」+ 导语 + 筛选条；右列 `InfoPanel`（库概览 4 条）。右栏宽 320。
2. 导语比常规低 6px（`leadOffset="low"`）。
3. 筛选条 `gap="tight"`（12px），三枚药丸：全部播放（primary）/ 随机播放（secondary）/ 音质偏好 · 无损优先（8 档）（neutral）。
4. 两个 `Section`：`我创建的 · N 个播放列表`、`我收藏的 · N 个播放列表`。分组间距 27px。
5. 瓦片网格：每行 4 枚，瓦片 16:9 封面 + 来源徽标（收藏夹 / 合集 / 系列 / 本地目录）+ 标题 + 元信息。
6. 第 3 枚瓦片演示玻璃操作带：`播放 | · | 下一首 | 入队 | 收藏 | 下载音频`（悬停或选中时露出）。
7. 注解带位置 `note--low`（top 693）。

**能力对齐（必须全部有落点）**

| 可见元素 | 现有能力 |
| --- | --- |
| 全部播放 / 随机播放 | `features/playlist/bulk-actions.ts` |
| 瓦片跳转 | `features/library/model.ts` → `getFavoriteItemHref` |
| 操作带 5 项 | `features/track/actions.ts` |
| 库概览 4 条 | `useFavoritesStore` + `useSettings`（音质偏好）+ 下载任务统计 |
| 音质偏好药丸 | `settings.audioQuality` |

**验收**

- 结构锚点：`h1Top=121`、`leadTop=197`、`filterTop=222`、`noteTop=693`（±2px）
- 硬锚点：顶栏 71、播放栏 88、留白 64、行高 68、缩略图 100×56
- 整屏平均亮度差 ≤ 12

---

## 02 · 我的收藏 · 详情　`/collection/:id`

- **设计页**：3　**原型**：`screens/02-playlist-detail.html`　**可滚动**
- **现状**：`features/playlist/playlist-detail.tsx` 已做壳层统一，但视觉未按 C+ 重做；收藏夹 / 合集 / 系列仍有三套内容视图。

**复刻要点**

1. 顶栏分段组反映集合类型：`收藏夹 · 11 | 合集 · 21 | 系列 · 31`（与 `CollectionType` 枚举一致，不得跨类型合并请求）。
2. 页头两栏（左标题列 + 右 `InfoPanel`），筛选条 `gap="base"`（20px）。
3. 曲目表用 `TrackTable`：序号 56 / 标题列 1fr / 第四列 220 / 第五列 152，右缩进 40。
4. 第 04 行 `is-current`，并演示 `.track-actions` 行内操作带。
5. 浮动弹层 `modal.modal--download`（560 × 153，位于 left 752 / top 225）—— 下载范围选择。
6. 注解带 `note`（top 653）。

**能力对齐**

| 可见元素 | 现有能力 |
| --- | --- |
| 三种集合类型切换 | `features/playlist/capabilities.ts`、`adapters/playlist/{favorite,series}.ts` |
| 播放全部 / 批量入队 / 批量下载 | `features/playlist/bulk-actions.ts` |
| 行内 5 项操作 | `features/track/actions.ts` |
| 下载弹层 | `components/video-pages-download-select-modal` |
| 编辑 / 删除 / 封面上传 | `components/favorites-edit-modal` |

**验收**：`h1Top=122`、`leadTop=192`、`filterTop=236`、`noteTop=653`；弹层矩形 ±2px。

---

## 03 · 稍后播放　`/later`

- **设计页**：4　**原型**：`screens/03-watch-later.html`
- **现状**：`pages/later`

**复刻要点**

1. 页头 `asideWidth={320}`（`page-head--narrow`），右栏 `InfoPanel` 展示同步状态：`上次同步 · 2 分钟前` / `37 条 · 已看 12 条`。
2. 顶栏分段：`全部 | 近 7 天 | 近 30 天`。
3. 曲目表第四列为观看进度（百分比 + 细条），第五列时长。
4. 注解带 `note`（top 653）。
5. 必须保留「同步来源为 B 站稍后再看」的说明文案。

---

## 04 · 本地音乐　`/local-music`

- **设计页**：5　**原型**：`screens/04-local-music.html`
- **现状**：`pages/local-music`

**复刻要点**

1. 顶栏分段为目录切换：`全部目录 | D 盘 · Lossless | E 盘 · Live 录音`。
2. 导语低 6px（`leadOffset="low"`），筛选条 `gap="loose"`（24px）。
3. 无分组标题，筛选条下 36px 直接接 `format-grid`：2 列 × 3 行 = 6 张格式卡（FLAC / WAV / MP3 / AIFF / M4A / WMA），卡高 130，内边距 `22px 28px 20px`，左侧格式色竖条。
4. 每张格式卡显示：格式名、文件数、总容量、是否可播放。
5. 注解带 `note--lower`（top 694）。

**关键约束**：本地扫描器只取 `title` 与 `duration`，**没有封面字段**。格式卡与列表缩略图必须使用「无封面载体」（格式色 + 格式名），不得伪造封面或留空灰块。

---

## 05 · 下载管理　`/download-list`

- **设计页**：6　**原型**：`screens/05-downloads.html`
- **现状**：`pages/download-list`

**复刻要点**

1. 顶栏分段：`全部 | 音频 | 视频`。
2. 列表列定义用 `tracklist--download`（序号 / 标题 / 220 / 152）。
3. 第四列用 `dl-status`：标签文字 + 220 × 4 进度条，四态各一行：
   - `下载中 · 62%`（进度条进行中）
   - `合并分块中 · 40%`（进度条进行中）
   - `已完成 · 可定位文件`（进度条满）
   - `任务出错 · 可重试`（进度条静止）
4. 注解带 `note`（top 653）。
5. **不得改动下载状态字符串**（`electron/ipc` 与 `electron-store media-downloads` 依赖这些值）。

**能力对齐**：暂停 / 继续 / 重试 / 取消 / 清空 / 定位文件 —— 全部走现有 IPC；清空全部必须二次确认。

---

## 06 · 搜索结果　`/search`

- **设计页**：7　**原型**：`screens/06-search.html`
- **现状**：`pages/search`

**复刻要点**

1. 内容顶部为 `searchfield`：高 **72**、圆角 **18**（`--biu-radius-field-lg`）、查询词 30px，右侧 `local-link`（在本地音乐中搜索）。**（1.3.12 订正：原「圆角 999」是错的 —— 那是原型的 `--r-field` 档，屏 06 的 `.searchfield` 不用它；原型 `app.css:1683` 与设计页第 7 页实测都是 18。）**
2. 顶栏分段即结果类型：`音乐视频 · 9 | 创作者 · 2`。**只能有这两类**。尾巴是**运行时结果数**（见 `spec-lock` 的 `topbarSegments.labelSources`），壳层里是模板，计数未知时不渲染悬空分隔符。
3. 视频结果表用 `tracklist--search` —— **无序号列**，缩略图直接贴左侧留白。
4. 创作者行用 `creator-row`：头像 **40** 圆形、行距 **56**、操作列 112（左缘 x1264），右侧「关注 / 已关注」按钮（高 32）。**（1.3.12 订正：原「107px | 1fr | 112px、头像 56」与设计页第 7 页实测不符 —— 实测头像 40、姓名墨迹左缘 x120；网格只钉「40 in x64 / 姓名 x120 / 操作列 x1264」，见 `geometry.creatorRow.gridRule`。）**
5. 第三个 `Section` 用 `section--tight`（12px）。
6. 注解带 `note--high`（top 598，容器相对值）。

**文案红线**：搜索框占位符与页面文案**不得**出现「歌曲 / 专辑 / 歌手」；原因是 `web-interface-search-type` 的 `search_type` 只有 `video` / `bili_user`。

---

## 07 / 08 · 发现音乐（卡片 / 列表）　`/`

- **设计页**：8 / 9　**原型**：`screens/07-discover-card.html`、`screens/08-discover-list.html`
- **现状**：`pages/music-recommend`（含 `grid-list` / `list` / `new-music-top` / `menu`）

> **✅ 开工前置已落地（1.3.15，2026-09-28）**：设计页第 8 页的参考图曾**纵向被压缩 0.9204**
> （画板高 978 被 `prepare_reference.sh` 的逐页 `resize((1440,900))` 压回 900），已纠正为
> 1440 × 900：`reference/page-08.png` 现为纠正后的图，原图留档 `reference/_source/page-08-raw.png`，
> 工具 `tools/design-fidelity/correct_reference.py`（幂等；生成脚本已复用同一份 `fit_canvas()`，
> **从 PDF 重生成不会再压一次**，`--selftest` 守住这一点）。
> **下方 07 的各项纵向数值均已换到 1440×900 口径**，可直接与渲染比对；壳层读数与其余 11 页一致
> （顶栏 72 / 播放栏 812）—— `verify.py` 的参考图体检（`pnpm verify:reference`，已接入 CI）现在把它
> 当标准页看待。完整证据与推导见 [`evidence/reference-page-08-distortion.md`](./evidence/reference-page-08-distortion.md)，
> 落地前后对照见 [`evidence/page08-correction-applied.png`](./evidence/page08-correction-applied.png)。
> 屏 08 用设计页第 9 页，始终未受影响。
>
> **纠正后才看得见的两件事**（都要落到实现里）：
> ① 本页头部节奏与第 9 页**不同** —— H1 起点一致（121 / 122），但**第 9 页的导语高 10px（192 对 202）、
> 筛选条高 3px（236 对 239）**（1.3.22 订正方向：原写「导语低 10px、筛选条低 3px」，把 y 差说反了），
> 此前被压缩吞掉；② **设计窗口比本工程高**（画板 978 对 900），设计页在播放栏之上有 819 行内容、
> 我们只有 741 行，多出的 78 行里躺着**本页的注解带**（画板 841–876）—— 所以注解带要按**页流**排在
> 专辑网格之后（首屏不可见），**不要**做成贴视口底的固定带。

**复刻要点（卡片态）**

1. 顶栏带 `topbar-note`：`已下线: 流行 / 鬼畜`。顶栏分段：`音乐分区 | 单一模块`。
2. 标题列用 `head-main--flat`（去掉错位基线），实测算 H1 墨迹 **121–172** / 导语 **202–221** / 筛选条 **239–287**。
3. 首段标题墨迹 315–330；`hero-card` **339–570**：`353px | 1fr | 128px`，左侧 16:9 主视觉（`.hero-art`），中部标题 + 描述，右侧 56px 圆形播放键 + `.hero-tag`。
4. 第二段标题墨迹 598–613；`album-grid` 3 张 `album-card` 自 **622** 起（900 视口内被播放栏截断），卡高 176，正文上边距 34。
5. 首个 `Section` 用 `section--push`（23px）。
6. 注解带 `note--lowest`：**画板 841–876，在 900 视口折线以下** → 按页流置于网格之后，首屏不可见。

**复刻要点（列表态）**

1. 顶栏同样带 `topbar-note`。
2. 标准 `TrackTable` 5 行。
3. 注解带 `note`（top 653）。
4. 两种视图共用同一份数据与同一组 `Track` 动作，仅切换渲染。

> **屏 08 收口（P3-S4，spec-lock 1.3.22 → 1.3.24，2026-09-28）** —— `--target app` 对设计页第 9 页
> **PASS**，平均亮度差 **8.73**（原型基线 9.66）；L1 硬锚点 4/4、结构带 7/7、横向实心带 1/1、
> 表头标签 1/1、内容带 `list` / `right` / `note` 三项均 **100%**。
>
> 这一屏的收口暴露了**两处工具缺陷 + 三处字号错误**，值此留档，因为三者都不是本屏特有的：
>
> 1. **`rowPitch` 一直读错了东西**（1.3.23 修工具）。它借道通用探针 `artRows = (64, 172, 290, 790, 16)`，
>    而这条 108px 窄列里还有段标题、表头序号 `#`、注解带 —— 屏 08 的设计侧因此读出 **9 条带**、
>    `rowPitch` 读成 55.0（渲染 60.1），而**两侧真实行距都是 68**。改法是回到注释原本说的「**实心**带」：
>    窗口收进缩略图内部（x124–170）且要求**近乎满宽**（≥0.9）—— 缩略图是实心矩形，文字墨迹再密也在
>    列方向留空（屏 08 实测：缩略图 1.00 / 段标题 0.85 / 表头 0.83 / 注解 0.55）。**这条闸门在 7 个屏上启用。**
> 2. **表头探针的序号列 `#`**（1.3.23）：设计侧它是几道 1–2px 笔画、渲染侧因抗锯齿连成**整整 8px**
>    （x64–71），恰好压在 `minlen = 8` 的门槛上 ⇒ 同一个表头两侧段数不同。修法是把窗口 x 下界
>    64 → **80** 直接排除序号列（`#` 的位置就是列起点 = 列表左缘，已由 `gutterLeft` 看守）。
> 3. **`typography.scale` 里有三档字号不是从设计稿量出来的**（1.3.24 订正）。原型 `tokens.css`
>    自述那组是「派生字号（同族，按 1.15 阶梯收敛）」，真值原样承袭了它们。量法：**汉字的 advance
>    恒等于 font-size** ⇒ 取一行横向墨迹的「最长等步进段」，报告步进 d 与段数。
>    - **导语 22 → 20**（第 10 处分歧）：设计稿跨**十页**一致读 20.0。这是影响面最大的一处 ——
>      每屏都有导语，22px 让所有页面比设计稿宽 10%（第 09 页 1053 对 970），而 `lead` 是**结构带、
>      只判 y 起点**，所以这条偏差**从未被任何闸门量到过**。
>    - **段标题 17 → 16**（第 11 处分歧）：`Section` 的 h2 此前借用 `--biu-type-small-size`（17，
>      角色是「歌词与浮层小字」）。新立 `--biu-type-section-title` 独立档，**不按 small 改** ——
>      small 另有歌词面板 / 信息面板 / 专辑卡 / 对话框四处未经举证的消费方。与 `listTitle` 同一条纪律：
>      **档位按角色立，不按巧合复用。**
>    - **注解带 13 → 14**（第 12 处分歧）：新立 `--biu-type-note`。**反证是行内副标题** —— 同一份测量里
>      第 09 页行 1 副标题（`音乐综合 · 创作激励计划`）读 13.0 且**设计 = 应用**，说明 `label` 档的 13
>      是对的（它另有 25 处消费方）。**这一档同时修掉了本屏注解带「折行对不上」的表象**：14px 下整段
>      注文超出文本框宽度而自然折成两行，第 2 行带起点落在 748（设计 748），`note` 覆盖率由**恰好 75%
>      （踩着阈值过关）**回到 **100%**。
> 4. 三档的行盒都由**像素类名**给定（`PageLead` 的 `leading-7` = 28、`Section` 的 `leading-6` = 24、
>    `AnnotationBand` 的 1.43 ≈ 20），**与字身解耦** ⇒ 改字号不挪任何 y。三个令牌的 `lineHeight`
>    按「行盒 ÷ 字身」回填成 1.4 / 1.5 / 1.43，让 font 简写与像素类名给出一致的行盒。
> 5. **回归**：屏 01 / 02 / 06 / 07 在改字号后复跑 `--target app` **全部 PASS**
>    （平均亮度差 11.44 / 10.22 / 6.21 / 8.04）。唯一被显式确认的**可视变更**是 `--biu-type-lead-size`
>    （`phase-boundary.json` 标 `visualImpact: true`）。

**产品红线**：发现音乐必须标注来源为 **B 站音乐分区（1003）**，并显式说明**非个性化推荐**。不得出现「每日推荐 / 私人 FM / 猜你喜欢」。

---

## 09 · 播放队列　`/queue`　⚠ 形态变更

- **设计页**：10　**原型**：`screens/09-queue.html`
- **现状**：`components/music-playlist-drawer`（抽屉）

**形态变更**

抽屉提升为独立路由页：路由 `/queue`，**保留顶栏与播放栏**。播放栏「队列 · N」按钮由打开抽屉改为导航到 `/queue`。
抽屉组件在路由切换完成后**删除**，不保留双实现。

**复刻要点**

1. 顶栏分段：`全部 | 音乐视频 | 本地文件`。
2. 导语文案需表达去重身份规则：`local:id / mv:bvid / audio:sid`。
3. 筛选条 5 枚药丸：播放全部 / 顺序播放 ▾ / 随机时保持分P顺序 · 开 / 清空队列 / 去重后 24 首 · 已折叠 3（accent）。
4. 分组标题 `队列 · 27 首 · 去重后 24`。
5. `TrackTable` 4 行，第 01 行 `is-current`，第 04 行带 `.track-actions`。
6. 拖拽排序必须保留（`@dnd-kit/sortable`）。
7. 注解带 `note`（top 653）。

**能力对齐**：`features/player/queue.ts` 的去重与身份规则；清空队列需二次确认。

---

## 10 · 正在播放 · 沉浸　`/now-playing`　⚠ 形态变更

- **设计页**：11　**原型**：`screens/10-now-playing.html`
- **现状**：`components/full-screen-player`（全屏弹层）

**形态变更**

提升为沉浸态路由 `/now-playing`：**隐藏顶栏与播放栏**，整屏为沉浸布局。原全屏播放器弹层在切换完成后删除。

**复刻要点**

1. `.stage--immersive` 背景：见 `cplus-token-bridge.md` §1.7。**不得**使用「右下蓝光」或「中心聚光」。
2. 顶部 `np-mode-seg` 三段切换：`封面 | 歌词 | 视频`。
3. `np-grid` 两栏：左 `np-art` 649 × 365（16:9，不方形裁切）；右 `np-info` 左内边距 18。
4. 右栏纵向：`np-title`（40/600）→ 两行 `np-meta`（15/400）→ `np-tags` → `lyrics` 面板（内边距 `24px 26px 17px`，行高 43，当前行高亮）。
5. 底部无独立播放栏，节奏内嵌：全宽进度条 `progressY = 700`、时间 `np-times y = 720`、控制带 752–808、播放键 **56px**。
6. 控制带左为 `np-source`（播放来源药丸，宽度**自适应不拉伸**），中为 transport，右为 `np-mode` + 音量等。
7. 注解带 `note--inline`（随内容排布，非绝对定位）。

**回归重点**：歌词滚动、频谱、封面背景、多分 P、系统媒体控制、全局快捷键、Mini 播放器切换。

---

## 11 · 设置　`/settings`

- **设计页**：12　**原型**：`screens/11-settings.html`
- **现状**：`pages/settings`（常规 / 播放 / 下载与本地 / 快捷键 / 高级 / 关于）

**复刻要点**

1. 顶栏分段：`常规 | 播放 | 高级`（完整分组含下载与本地、快捷键、关于）。
2. 页头两栏，右栏 `InfoPanel`「当前配置」。
3. 设置列表用 `tracklist--settings` + `settinglist`（分组标题与首行间距 46）。
4. `setting-row` 行高 68，含：序号、`setting-icon`（40 × 40 / 10 圆角 / 蓝色调渐变）、名称 + 描述、当前值、计数。
5. 注解带 `note`（top 653）。

**随主题收敛一并调整**（决策 2）

| 设置项 | 处置 |
| --- | --- |
| `themeMode` | 收敛为固定深色。保留字段以兼容旧存储，但 UI 不再暴露浅色 / 跟随系统 |
| `primaryColor` | 移除入口。保留字段，读取时忽略 |
| `borderRadius` | 移除入口。圆角改为固定令牌 |
| `backgroundColor` | 移除入口。保留字段，读取时忽略 |
| `fontFamily` | 保留 |
| `pageTransition` / `displayMode` / `audioQuality` / `downloadPath` / `proxySettings` / `shortcuts` / `localMusicDirs` / `reportPlayHistory` / `showSearchHistory` / `closeWindowOption` / `autoStart` / `ffmpegPath` | 全部保留 |

**兼容要求**：旧设置文件必须能无损读取；缺失字段沿用默认值；未知字段不写入存储。`tests/settings.test.ts` 需覆盖「浅色主题 + 自定义主色 + 自定义圆角」的旧配置升级路径。

---

## 12 · 迷你播放器与系统集成　`/mini-player`

- **设计页**：13　**原型**：`screens/12-mini-player.html`
- **现状**：`pages/mini-player`

**复刻要点**

1. 顶栏分段：`迷你播放器 | 托盘 | 全局快捷键`。
2. 上方 `tracklist--mini` 3 行曲目（列定义 `56 / 1fr / 300 / 152`）。
3. 下方 `mini-row` 三张卡：
   - `mini-card--player`：迷你窗口预览（16:9 封面 + 标题 + 进度 + 控制 + 展开按钮，`mini-expand`）
   - `mini-card--tray`：托盘菜单预览，5 条 `tray-item`
   - `mini-card--keys`：快捷键列表，含 `.kbdrow.is-conflict` 冲突态
4. 注解带 `note--footer`（top 704，12 屏中最低位）。

**能力对齐**：`electron/mini-player.ts`、`electron/windows/`、`electron/shortcut.ts`、`pages/mini-player/actions.ts`。快捷键冲突检测必须保留。

---

## 延展屏（无独立视觉稿）

| 页面 | 路由 | 入口 | 规则 |
| --- | --- | --- | --- |
| B站历史 | `/history` | 头像菜单 | 用同一套 `ui` 组件与令牌重建，不新造令牌、不改信息架构 |
| 我的关注 / 关注动态 | `/follow` | 头像菜单 | 同上 |
| 创作者主页 | `/user/:id` | 行内跳转 | 同上 |
| 视频合集 / 收藏夹 / 系列 | `/collection/:id` | 列表跳转 | 归入第 02 屏的统一壳层 |
| 设计系统展示页 | `/design-system` | 仅开发环境 | 升级为组件 + 令牌的活文档，每个组件标注对应原型类与设计页 |

**规则细化**：延展屏允许「按同一语言推断」，但**必须**复用已建成的 `ui/patterns` 组件；若需要一个新组件，先判断它是否在第 01–12 屏出现过 —— 出现过就用同一实现，没出现过才允许新增，并在 `docs/design/` 补一行登记。

---

## 通用收工检查表（每屏都跑）

- [ ] `pnpm test --run` 通过
- [ ] `node tools/design-fidelity/verify.mjs --screen <屏名>` 输出 `PASS`
- [ ] `node tools/design-fidelity/check-literals.mjs` 无新增违规
- [ ] 硬锚点零偏差；band 偏差 ≤ 2px；平均亮度差 ≤ 12
- [ ] 该屏所有可见操作已在「能力对齐」表中列出，且**全部**映射到现有 store / service / IPC
- [ ] 无新增 API、无新增 PRD 未承诺的能力
- [ ] 焦点态、键盘路径、减少动效下的表现已核对
- [ ] 路由已切换，旧实现已在**同一 PR 内删除**
