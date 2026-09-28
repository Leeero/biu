# 保真度数据夹具

## 为什么需要它

`verify.py` 比对的是**渲染结果**与**设计稿 PNG**。如果渲染用的是真实数据，那么封面、时长、用户名每变一次，比对结果就变一次 —— 报出的差异分不清是「视觉实现走样」还是「数据本来就不同」。因此比对必须在固定数据下进行。

夹具的第二个用途是**承载占位素材**。设计稿里的封面是具体作品，重构时不可能拿到同一张图，只能用一个稳定的占位渐变代替。这些渐变是**数据**，不是设计令牌，所以它们的字面色值写在这里，而不是 `src/ui/tokens/palette.css`。

## 契约

1. **每个目标屏一份夹具**，文件名与 `cplus-spec-lock.json` 的 `screens[].no` 对应，例如 `01-library.json`。
2. 夹具只描述**展示内容**（标题、副标题、条数、行数据、封面占位），不描述布局。
3. 夹具里的色值只能是占位素材色（见 `placeholder-art.json`），不得出现 `palette.css` 里已有的设计令牌值 —— 一旦出现，说明有人把视觉决策混进了数据。
4. `verify.py` 在 `--target app` 下通过 `?fixture=<name>` 查询参数或 mock 层注入夹具；在 `--target prototype` 下夹具已内联在原型 HTML 里，无需注入。
5. **夹具带 `nowPlaying` 的屏，必须同时登记进 `src/features/player/now-playing.ts` 的 `NOW_PLAYING_FIXTURES`，并在 `cplus-spec-lock.json` 里启用 `playbarDetail`。** 播放栏是**全局**组件（读 `usePlayList` / `usePlayProgress`），页面夹具驱动不了它 —— 只写夹具不登记，播放栏就还是空态（设计稿 12 页里 11 页是满态），而页面其余部分照常正确，于是差异**看得见却没人判**；没有 `playbarDetail` 则栏内构成连看都没人看。两条都由 `tests/now-playing-fixtures.test.ts` 兜住（它遍历本目录，将来新增的屏自动纳入）。

## 当前状态（P3）

- `placeholder-art.json` —— 已就绪。从原型 12 屏中提取的 13 组封面占位渐变。
- `01-library.json` —— 已就绪（P3 屏 01 落地）。应用侧镜像在 `src/ui/fixtures/screen-01-library.ts`，
  由 `tests/fixture-screen-01.test.ts` 钉住逐字一致。注入方式：应用在 URL 携带
  `?fixture=01-library` 时改用夹具数据渲染（`src/features/library/fixture.ts`），
  真实数据路径（useFavoritesStore / useSettings / 下载 IPC）不经过夹具。
  夹具瓦片的 `artIndex` 指向 placeholder-art.json 的 gradients 下标 —— 设计稿每个
  瓦片的封面就是那个渐变，逐字对应，不做哈希挑选。
- `02-playlist-detail.json` / `06-search.json` —— 已就绪。应用侧镜像分别在
  `src/ui/fixtures/screen-02-playlist-detail.ts` / `screen-06-search.ts`，由
  `tests/fixture-screen-02.test.ts` / `fixture-screen-06.test.ts` 钉住。
- `07-discover-card.json` —— 已就绪（P3-S4）。应用侧镜像在
  `src/ui/fixtures/screen-07-discover-card.ts`，由 `tests/fixture-screen-07.test.ts`
  钉住。两点与其余屏不同，改动前先看：
  1. **顶栏 chrome 不在夹具里**。「已下线: 流行 / 鬼畜」与「音乐分区 | 单一模块」
     是**路由级 chrome**（spec-lock `globalChrome.topbarNote` /
     `topbarSegments.byRoute["/"]`），由 `route-shell.ts` 声明、`TopBar` 渲染 ——
     夹具只带页面内容，测试断言它的缺席（重复声明会各自漂移）。屏 06 的 `/search`
     结果数相反，那是运行时数据，必须由页面给出。
  2. **专辑卡没有 `ratioNote` 字段**：设计稿三张封面左下角逐点为空，原型的「1:1」
     是原型发挥。缺字段本身就是真值，由测试断言。大卡的 `ratioNote` 是有的。
  3. **封面档位叫 `artVariant` 而不是 `artIndex`**（1.3.19 起）。屏 01 / 02 / 06 的
     夹具用 `artIndex` 指向 `placeholder-art.json` 的 `gradients` **下标**，那几屏的
     封面确实是渐变；屏 07 的四个封面位是**纯平色**，值只能按名字取（`heroCard` /
     `albumCard1..3`，见 `PLACEHOLDER_RADIALS`），下标在这里没有意义。
     **不要为了「统一」把屏 07 改回下标** —— 那会把平色退回渐变，而渐变起点的亮度
     （69.7）高于内容带阈值（60），封面顶部会被判成墨迹、把徽标墨迹并进同一条带，
     `list` 覆盖率直接掉到 60%（spec-lock 1.3.19 第 ④ 条）。**数据夹具的亮度会进闸门。**
  4. **播放栏的 `nowPlaying` 必须登记**（1.3.21 起）。设计页第 8 页的播放栏是**满态**，
     与第 02/03 页同源（整条栏体逐像素平均差 1.73，四枚探针的带相差 ≤1 行）；夹具里
     早就写了 `nowPlaying`，但 1.3.20 之前没有登记进 `NOW_PLAYING_FIXTURES`，也没有
     启用 `playbarDetail` ⇒ 渲染侧是空态（`--:--/--:--`、`队列 · 0`）而**没有任何闸门**
     发现。副行是小写 `banner`（1.3.21 订正，此前写的是 `Banner`）；运输键是**播放三角**
     而非暂停，故 `playing: false` 是对的。契约 5 是这件事的通用形式。
  5. **`nowPlaying` 的进度填充宽度不在闸门内**：`playbarProgress` 判的是整条槽底
     （792–1171）。本页填充 x792–923（宽 132 = 34.7%）与它自己的 82 / 228 = 36% 自洽，
     但**设计页第 3 页**同样写 `01:22 / 03:48` 却只画到 x792–891（宽 100 = 26.3%）——
     设计稿自身不一致，故不为填充宽度设探针。屏 02 的夹具跟随的是**时间文字**，不动。
- `08-discover-list.json` —— 已就绪（P3-S4，屏 08 发现音乐 · 列表）。应用侧镜像在
  `src/ui/fixtures/screen-08-discover-list.ts`，由 `tests/fixture-screen-08.test.ts`
  （9 项）与 `tests/discover-list-view.test.tsx`（13 项）钉住。六点与其余屏不同：
  1. **顶栏 chrome 同样不在夹具里**（与屏 07 同源）：「已下线: 流行 / 鬼畜」与
     「音乐分区 | 单一模块」是路由级 chrome。1.3.24 起 `topbarNote` 已在
     `TOPBAR_NOTE_BY_ROUTE["/"]` 声明并渲染；分段组仍留在 `DEFERRED_SEGMENTS["/"]`
     —— 它的两段是**数据源切换**，而 `/` 的真实数据路径尚未收敛。
  2. **五行缩略图是纯平色，按行位次命名**（`artVariant: listRow1..5`，见
     `PLACEHOLDER_RADIALS`），不做哈希挑选 —— 与屏 07 的理由相同（平色的亮度
     41.7–45.3 全低于内容带阈值 60；换成渐变就会把封面顶部判成墨迹）。
  3. **第 04 行是「操作带常驻露出」的演示行，不是当前行**：只渲染
     `TrackTableActions`，**不传 `current`**。设计稿行 3/4/5 的列中位同为 7.00
     （同一条底板渐变），而 `.track-row.is-current::before`（7% 白）会让它变成 26.0。
     与屏 02 同一条结论（spec-lock `geometry.list.currentStateNote`）。
  4. **注解带必须由页面渲染成 `ScrollContainer` 的兄弟**，且用 `AnnotationBand` 的
     **缺省锚点**（`top: 653`，内容区相对 ⇒ 盒顶 724）。不要用 `anchor="inline"`
     （会落到 738，低 14px；屏 07 用 inline 是因为它那一页在画板折线以下）。
     排进 `ScrollContainer` 内部也会落到 757 —— 那个容器的根是 `position: relative`。
  5. **注解带必须是两行，这是 1.3.24 定下的判据**。设计页第 2 行只有 `地库混排。`，
     是 **14px** 字身下整段注文放不进文本框的自然折行（`--biu-type-note`，1.3.24 新立
     的独立档）；在 13px 下整段只有 1274 放得下 ⇒ 一行，`note` 内容带覆盖率**恰好
     75%**、踩着阈值过关。**看到「只渲染一行」先查 `AnnotationBand` 的字号是不是被改回
     了 13，不要加 `max-w` 或手写换行** —— 判据是「带起点 ±4px」，第 2 行留几个字不在
     判定范围内。注文本身逐字取的是**设计稿**（无引号、写「混排」），与原型那段
     （有「」引号、写「混淆」）**不是同一段文字**。
  6. **播放栏的 `nowPlaying` 与屏 07 不是同一条**（曲名「神呀，接住她的眼泪吧」/
     `音乐区 UP · 32.1 万播放` / 54 / 242 / 队列 · 12 / `playing: false`），已登记进
     `NOW_PLAYING_FIXTURES`。封面走 `playbarCover` 占位（设计页实测纯平色
     (40,41,50)）—— 这条占位比设计稿暗约 12，四枚探针只判带起点，故未进闸门。
- 其余屏夹具（03…05 / 09…12）—— **随对应屏幕施工落地**（P3-P6），先于该屏的 verify 验收。
- `--target app` 的服务：构建产物（`dist/web`）+ `tools/design-fidelity/serve-app.mjs`
  静态伺服（SPA fallback），verify.py 用 `--base-url http://127.0.0.1:4173`。
