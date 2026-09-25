import { useState } from "react";

import { AlbumCard, AlbumGrid } from "@/ui/patterns/album-card";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { CreatorRow } from "@/ui/patterns/creator-row";
import { Dialog, DialogAction } from "@/ui/patterns/dialog";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { FormatCard, FormatGrid } from "@/ui/patterns/format-card";
import { HeroCard } from "@/ui/patterns/hero-card";
import { InfoPanel } from "@/ui/patterns/info-panel";
import { InlineProgress } from "@/ui/patterns/inline-progress";
import { LyricsPanel } from "@/ui/patterns/lyrics-panel";
import { MediaGrid } from "@/ui/patterns/media-grid";
import { MediaTile, type TileActionSpec } from "@/ui/patterns/media-tile";
import { PageHeader, PageLead } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
  type TrackActionSpec,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { Tag } from "@/ui/primitives/tag";

import { ExhibitSection, ExhibitRow, Showcase, StateMatrix } from "./showcase";

const noop = () => undefined;

/**
 * 列表行操作带的内容。原型 `.track-actions` 在 6 屏里都是同一组固定 5 项
 * （播放 / 上一首 / 下一首 / 入队 / 收藏 / 下载），故这里也照固定组合演示。
 */
const ROW_ACTIONS: TrackActionSpec[] = [
  { key: "prev", label: "上一首", icon: "prev", onPress: noop },
  { key: "next", label: "下一首", icon: "next", onPress: noop },
  { key: "queue", label: "加入队列", icon: "queue-add", onPress: noop },
  { key: "heart", label: "收藏", icon: "heart", onPress: noop },
  { key: "download", label: "下载音频", icon: "download", onPress: noop },
];

const TILE_ACTIONS: TileActionSpec[] = [
  { key: "next", label: "下一首", icon: "next", onPress: noop },
  { key: "queue", label: "加入队列", icon: "queue-add", onPress: noop },
  { key: "heart", label: "收藏", icon: "heart", onPress: noop },
  { key: "download", label: "下载音频", icon: "download", onPress: noop },
];

const SAMPLE_ROWS = [
  {
    id: "t1",
    title: "「神呀，接住她的眼泪吧」— 这一首歌完整版来啦",
    sub: "音乐综合 · 来自默认收藏夹",
    cell: "收藏于 09-21 · 分P 1/1",
    tail: "03:18",
  },
  {
    id: "t2",
    title: "【猎 Hunter】「荒野求生的小曲」",
    sub: "原创音乐 · 来自默认收藏夹",
    cell: "收藏于 09-18 · 分P 1/2",
    tail: "02:47",
  },
  {
    id: "t3",
    title: "我有两颢搞丸！！！",
    sub: "翻唱 · 来自默认收藏夹",
    cell: "收藏于 09-18 · 分P 1/2",
    tail: "02:47",
  },
  {
    id: "t4",
    title: "录歌 和好朋友在学校的最后一个晚上",
    sub: "校园音乐 · 来自默认收藏夹",
    cell: "收藏于 09-12 · 分P 1/1",
    tail: "05:11",
  },
];

const TrackRowDemo = ({ id, index, current }: { id: string; index: number; current?: boolean }) => {
  const row = SAMPLE_ROWS[index] ?? SAMPLE_ROWS[0]!;
  return (
    <TrackTableRow trackId={id} current={current}>
      <TrackIndex value={index + 1} />
      <TrackMain>
        <TrackArt artKey={id} />
        <TrackText title={row.title} subtitle={row.sub} />
      </TrackMain>
      <TrackCell>{row.cell}</TrackCell>
      <TrackCell align="end">{row.tail}</TrackCell>
    </TrackTableRow>
  );
};

export const PatternsExhibit = () => {
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seekLine, setSeekLine] = useState(2);

  return (
    <ExhibitSection
      title="模式件"
      note="跨屏复用的组合件。每个展位标注了对应的原型类与设计页 —— 少了这两项，展位就退化成「看起来还行的组件陈列」，回不到设计稿核对。"
    >
      <Showcase
        name="分组"
        proto=".section / .section-head / .section-title / .section-note"
        page={2}
        note="标题用 <h2> 而非 <div>：页面已有 <h1>（PageHeader），分组用 h2 才能让读屏的标题大纲成立 —— 全是 div 时「按标题跳转」这种导航方式就失效了。段间 27px 用 [&+&] 复刻，它比单类的 gap 特异性更高，会覆盖首段间距；这是有意的：原型里「标题到首段」与「段与段之间」本来就是两个值。"
      >
        <Section title="我的收藏夹" note="214 个内容" gap="base">
          <p className="m-0 text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            首段。段间间距 27 由 Section 自持，不在这里写外边距。
          </p>
        </Section>
        <Section title="最近播放" note="gap = tight（12）">
          <p className="m-0 text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            第 06 屏搜索结果的分组贴得更近。
          </p>
        </Section>
        <Section title="为你推荐" note="gap = push（23）">
          <p className="m-0 text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            第 07 屏首屏分组整体低 9px。
          </p>
        </Section>
        <Section>
          <p className="m-0 text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            不传 title 时只渲染容器，用于纯布局。
          </p>
        </Section>
      </Showcase>

      <Showcase
        name="信息面板"
        proto=".panel / .panel-eyebrow / .panel-list"
        page={2}
        note="材质就是设计稿里唯一那套玻璃（白 16% + 白 18% 描边 + 模糊 20），没有第二套，不要另起。它是 PageHeader 右侧那一栏的标准内容。用 <aside>：面板里的信息是主内容的旁注，语义上不属于主阅读流。"
      >
        <div className="max-w-[360px]">
          <InfoPanel
            eyebrow="默认收藏夹"
            items={["214 个内容 · 12 小时 08 分", "最后更新 09-21", "来源：B站收藏夹 · 公开"]}
          />
        </div>
      </Showcase>

      <Showcase
        name="筛选条"
        proto=".filterbar"
        page={2}
        note="几何是 L1 硬锚点：条高 48、内边距 6、药丸高 36、药丸间隔 4。底纹用白 13%（凹槽档），比药丸自身底色深一档 —— 两者同色的话未选中药丸在条内看不出层次，整条会糊成一块。用 role=group 而非 toolbar：toolbar 承诺方向键在按钮间移动，这里没有 roving tabindex，不给兑现不了的承诺。"
      >
        <FilterBar label="收藏夹筛选" gap="flat">
          {[
            { key: "all", label: "全部 214" },
            { key: "video", label: "音乐视频 96" },
            { key: "audio", label: "音频 118" },
            { key: "lossless", label: "无损 42" },
          ].map(item => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={
                filter === item.key
                  ? "h-[var(--biu-layout-pill-h)] cursor-pointer rounded-[var(--biu-radius-pill)] bg-[rgb(var(--biu-inverse-surface))] px-[18px] text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-inverse-ink))]"
                  : "h-[var(--biu-layout-pill-h)] cursor-pointer rounded-[var(--biu-radius-pill)] px-[18px] text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-tertiary))] hover:bg-[var(--biu-veil-8)]"
              }
            >
              {item.label}
            </button>
          ))}
        </FilterBar>
        <div className="mt-6 flex flex-col gap-4">
          {(["tight", "base", "flat", "loose"] as const).map(gap => (
            <div key={gap} className="flex items-center gap-4">
              <FilterBar label={`间距变体 ${gap}`} gap="base">
                <span className="px-[18px] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-tertiary))]">
                  gap = {gap}
                </span>
              </FilterBar>
              <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
                tight 12 / base 20 / flat 15 / loose 24
              </span>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase
        name="页面标题"
        proto=".page-head / .head-main"
        page={2}
        note="两列网格 minmax(0,1fr) + 右栏，右栏默认 360。baseline=flat 对应原型的 .head-main--flat（第 07 屏：标题列整体上移 11px，因为没有 h1 上方的对齐需要）。title 是 <h1>，一页只有一个。actions 是迁移期的兼容别名，原型里页面级操作实际在 FilterBar 内 —— 新屏请把操作放进 FilterBar。"
      >
        <div className="flex flex-col gap-10">
          <PageHeader
            title="我的音乐库"
            lead="收藏夹、合集与本地目录的入口。"
            baseline="aligned"
            aside={<InfoPanel eyebrow="概览" items={["收藏 214", "合集 8", "本地 56"]} />}
          />
          <PageHeader title="发现音乐" lead="按榜单与合集发现内容。" baseline="flat" leadOffset="low" />
          <div>
            <p className="m-0 mb-2 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              无 h1 的屏（第 06 屏搜索结果）直接用 PageLead：
            </p>
            <PageLead offset="flat">搜索音乐视频与创作者，本地库为跨页入口。</PageLead>
          </div>
        </div>
      </Showcase>

      <Showcase
        name="注解带"
        proto=".note 的六个位置变体"
        page={2}
        note="这不是调试信息，而是设计方案的组成部分：设计稿把「这一屏能做什么」写在界面底部，让能力可读。6 个 y 值已登记在真值里（598 / 653 / 693 / 694 / 698 / 704），不要自己算。非 inline 档是绝对定位且左右各留一个 gutter，叠在内容之上不占高度；pointer-events-none 是重构新增的（原型无交互）—— 去掉它，列表滚到该区域时那些行会点不动。"
      >
        <div className="relative h-[180px] overflow-hidden rounded-[var(--biu-radius-md)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-sunken)]">
          <div className="absolute inset-x-0 top-6">
            <AnnotationBand anchor="inline">
              叠在内容之上的注解带（inline 档随内容排布，这里只是放进容器演示；其余五档用绝对 y 定位）。
            </AnnotationBand>
          </div>
          <div className="absolute inset-x-0 bottom-8">
            <AnnotationBand anchor="inline">
              每个 Track 的 8 项能力都有落点：5 项在操作带，其余 3 项在右键菜单。
            </AnnotationBand>
          </div>
        </div>
        <p className="m-0 mt-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
          位置变体：high 598（第 06 屏）、基准 653、low 693（第 01 屏）、lower 694（第 04 屏）、lowest 698（第 07
          屏）、footer 704（第 12 屏）。
        </p>
      </Showcase>

      <Showcase
        name="轨道表"
        proto=".tracklist / .track-head / .track-row / .track-index / .track-art / .track-main / .track-cell / .track-actions"
        page={2}
        note="P2 最吃重的一件：6 屏列表共同的骨架（收藏夹 / 稍后再看 / 下载 / 搜索 / 发现 / 队列 / 设置 / 迷你预览）。list-pad-r 的右缩进用 40。列模板走 context（对应原型的 --cols）：用 CSS 变量时「忘了设变量」会静默退化成单列，很难查。行高亮是整行通铺、上下内缩 2px、圆角 8，用 ::before 画；悬停 4% / 当前 7%，当前态**压过**悬停态 —— 原型靠书写顺序保证，这里显式重述了一条 hover+current 规则把它钉死，不赌 Tailwind 的变体输出顺序。原型无重排交互，onReorder 是方案 §5.2 冻结的 API 占位（P5 队列页用），故有意不给行加 tabIndex：214 行会变成 214 个 Tab 停留点。"
      >
        <div className="flex flex-col gap-8">
          <div>
            <p className="m-0 mb-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              variant = base（56 / 1fr / 220 / 152），带表头
            </p>
            <TrackTable
              variant="base"
              currentId="t3"
              columns={[
                { key: "no", label: "#" },
                { key: "content", label: "内容" },
                { key: "saved", label: "收藏于 · 分P" },
                { key: "dur", label: "时长", align: "end" },
              ]}
            >
              {SAMPLE_ROWS.slice(0, 3).map((row, index) => (
                <TrackRowDemo key={row.id} id={row.id} index={index} />
              ))}
            </TrackTable>
          </div>

          <div>
            <p className="m-0 mb-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              actions-visible：行内悬浮操作带（绝对定位，不占列 —— 原型里它是 4 列行的第 5 个子元素）
            </p>
            <TrackTable variant="base" currentId="t4">
              <TrackTableRow trackId="t4">
                <TrackIndex value={4} />
                <TrackMain>
                  <TrackArt artKey="t4" />
                  <TrackText title={SAMPLE_ROWS[3]!.title} subtitle={SAMPLE_ROWS[3]!.sub} />
                </TrackMain>
                <TrackCell>{SAMPLE_ROWS[3]!.cell}</TrackCell>
                <TrackCell align="end">{SAMPLE_ROWS[3]!.tail}</TrackCell>
                <TrackTableActions
                  primary={{ key: "play", label: "播放", icon: "play", onPress: noop }}
                  actions={ROW_ACTIONS}
                />
              </TrackTableRow>
            </TrackTable>
          </div>

          <div>
            <p className="m-0 mb-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              variant = download（第三列 220，状态列带进度）
            </p>
            <TrackTable
              variant="download"
              columns={[
                { key: "no", label: "#" },
                { key: "file", label: "文件" },
                { key: "status", label: "状态" },
                { key: "size", label: "大小", align: "end" },
              ]}
            >
              {[
                {
                  id: "d1",
                  title: "「神呀，接住她的眼泪吧」— 这一首歌完整版来啦",
                  sub: "无损 30251 · 音频 · FLAC · 今天 16:02",
                  label: "下载中 · 62%",
                  percent: 62,
                  size: "12.4 MB",
                },
                {
                  id: "d2",
                  title: "【猎 Hunter】「荒野求生的小曲」",
                  sub: "杜比 30250 · 音频 · M4A · 今天 15:48",
                  label: "合并分块中 · 40%",
                  percent: 40,
                  size: "18.7 MB",
                },
                {
                  id: "d3",
                  title: "我有两颢搞丸！！！",
                  sub: "高清 30280 · 视频 · MP4 · 昨天 21:30",
                  label: "已完成 · 可定位文件",
                  percent: undefined,
                  size: "86.2 MB",
                },
                {
                  id: "d4",
                  title: "录歌 和好朋友在学校的最后一个晚上",
                  sub: "自动 30232 · 音频 · 今天 14:11",
                  label: "任务出错 · 可重试",
                  percent: undefined,
                  size: "—",
                },
              ].map((row, index) => (
                <TrackTableRow key={row.id} trackId={row.id}>
                  <TrackIndex value={index + 1} />
                  <TrackMain>
                    <TrackArt artKey={row.id} />
                    <TrackText title={row.title} subtitle={row.sub} />
                  </TrackMain>
                  <InlineProgress label={row.label} percent={row.percent} />
                  <TrackCell align="end">{row.size}</TrackCell>
                </TrackTableRow>
              ))}
            </TrackTable>
          </div>

          <div>
            <p className="m-0 mb-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              variant = search（无表头、无序号列，3 列）
            </p>
            <TrackTable variant="search">
              {[
                {
                  id: "s1",
                  title: "【反乌托邦】AI 小潮 team 在「反乌托邦」里「拼接遗憾」",
                  sub: "潮汕好男人 · 12.4 万播放",
                  tail: "04:12",
                },
                { id: "s2", title: "「反乌托邦」钢琴改编 · 城市夜景版", sub: "琴键上的猫 · 3.8 万播放", tail: "03:26" },
              ].map(row => (
                <TrackTableRow key={row.id} trackId={row.id} current={row.id === "s2"}>
                  <TrackMain>
                    <TrackArt artKey={row.id} />
                    <TrackText title={row.title} subtitle={row.sub} />
                  </TrackMain>
                  <TrackCell />
                  <TrackCell align="end">{row.tail}</TrackCell>
                </TrackTableRow>
              ))}
            </TrackTable>
          </div>

          <div>
            <p className="m-0 mb-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              variant = mini（第三列 300）/ variant = settings（5 列，无行高亮）
            </p>
            <TrackTable
              variant="mini"
              columns={[
                { key: "no", label: "#" },
                { key: "cap", label: "能力" },
                { key: "desc", label: "说明 · 状态" },
                { key: "src", label: "来源", align: "end" },
              ]}
            >
              {[
                {
                  id: "m1",
                  title: "迷你播放器",
                  sub: "360×140 独立小窗 · 收起主窗口后自动继续播放",
                  cell: "常驻置顶 · 可拖动",
                  tail: "Electron",
                },
                {
                  id: "m2",
                  title: "托盘菜单",
                  sub: "播放 / 暂停 · 上一首 / 下一首 · 显示主窗口 · 退出",
                  cell: "5 个菜单项",
                  tail: "main.ts",
                },
              ].map((row, index) => (
                <TrackTableRow key={row.id} trackId={row.id}>
                  <TrackIndex value={index + 1} />
                  <TrackMain>
                    <TrackArt artKey={row.id} />
                    <TrackText title={row.title} subtitle={row.sub} />
                  </TrackMain>
                  <TrackCell>{row.cell}</TrackCell>
                  <TrackCell align="end">{row.tail}</TrackCell>
                </TrackTableRow>
              ))}
            </TrackTable>
          </div>
        </div>
      </Showcase>

      <Showcase
        name="媒体瓦片与栅格"
        proto=".grid / .tile / .tile-art / .tile-copy / .actionband"
        page={2}
        note="四层：封面 → ::after 底部渐隐遮罩 → 徽标 → 文案。遮罩不是装饰：封面可能是任意亮度，没有它浅色封面上的白字读不出来。栅格列数固定 4/3/2（原样照搬 repeat(N, minmax(0,1fr))，这已经是弹性的），**不改成 auto-fill(min 206px)** —— 1440 基线下 auto-fill 会算出 6 列，与设计稿不符：列数是设计决策，容器宽度不该改变它。瓦片的「选中」在原型的表达与悬停相同（都是露出操作带），因此这里只挂 aria-current + 常驻露出，不加描边。"
      >
        <StateMatrix
          states={["default", "hover", "pressed", "focus-visible", "disabled", "loading"]}
          render={state => (
            <MediaTile
              title="夜航电子"
              meta="42 首 · 3 小时 12 分"
              artKey={`tile-${state}`}
              badge="收藏夹"
              actions={[{ key: "play", label: "播放", icon: "play", onPress: noop }, ...TILE_ACTIONS]}
              forceActionsVisible={state === "loading"}
              current={state === "disabled"}
            />
          )}
        />
        <p className="m-0 mt-4 text-[length:var(--biu-type-micro-size)] leading-[1.7] text-[rgb(var(--biu-text-quaternary))]">
          上面一列里第 6 格（loading）强制露出操作带用来演示 actions-visible，第 5 格（disabled）以 current
          演示「选中即常驻露出」。
        </p>

        <div className="mt-6 flex flex-col gap-6">
          <MediaGrid columns={4}>
            {["夜航电子", "器乐练习", "Live 现场", "本地无损库"].map((title, index) => (
              <MediaTile
                key={title}
                title={title}
                meta={index === 3 ? "56 首 · 4 小时 05 分 · FLAC" : `${20 + index * 8} 首 · 无损`}
                artKey={`grid-${index}`}
                badge={index === 3 ? "本地目录" : index % 2 === 0 ? "收藏夹" : "合集"}
                badgeVariant={index === 3 ? "dir" : "default"}
              />
            ))}
          </MediaGrid>
          <MediaGrid columns={3}>
            {["器乐练习", "夜航电子", "深夜循环"].map((title, index) => (
              <MediaTile key={title} title={title} meta="28 首 · 2 小时 04 分" artKey={`g3-${index}`} badge="系列" />
            ))}
          </MediaGrid>
          <MediaGrid columns={2}>
            {["深夜循环", "睡前歌单"].map((title, index) => (
              <MediaTile key={title} title={title} meta="31 首 · 无损" artKey={`g2-${index}`} badge="合集" />
            ))}
          </MediaGrid>
        </div>
      </Showcase>

      <Showcase
        name="大卡"
        proto=".hero-card / .hero-art / .hero-body .tag / .hero-tags / .hero-play"
        page={8}
        note="三列 420 / 1fr / 96，间距 32，内边距 24。第三列是**播放键的槽位**（宽 96、键 62 居中）—— 播放键不是绝对定位而是 grid 的一列，这样窄容器下会自动收窄；改成绝对定位就会压到文案上。发现音乐的卡片分支与列表分支用两条不同的固定渐变，都在数据夹具里。"
      >
        <HeroCard
          title="反乌托邦 · 2024 Remaster"
          tag={<Tag variant="accent">独家首发</Tag>}
          meta="卧室音乐计划 · 12.4 万播放 · 04:12"
          tags={[
            { key: "lossless", label: "无损 30251", variant: "quality" },
            { key: "dolby", label: "杜比全景声", variant: "plain" },
            { key: "mv", label: "音乐视频", variant: "plain" },
          ]}
          artKey="hero-card-demo"
          badge="合集"
          ratioNote="封面 16:9 · 672w"
          onPlay={noop}
          playLabel="播放合集"
        />
      </Showcase>

      <Showcase
        name="专辑卡与栅格"
        proto=".album-grid / .album-card / .album-art / .album-body / .album-foot"
        page={2}
        note="**原型把 .album-card 定义了两次**，生效的是文件末尾那一处：内边距 16（不是 18）、固定高 176、body 上内边距 34、标题 22/28。照前一处写会得到 18px 内边距和自适应高度 —— 那是原型自己改掉的旧稿。固定 176 是设计决策：三张卡在同一行高度必须一致。栅格间距 23 也与瓦片的 20 不同，别顺手统一。"
      >
        <AlbumGrid>
          {[
            { title: "夜航", meta: "NOISE_LAB · 12 首 · 2024-08-12", tag: "专辑", badge: "无损" },
            { title: "器乐练习", meta: "琴键上的猫 · 28 首 · 2024-06-30", tag: "合集", badge: "合集" },
            { title: "深夜循环", meta: "Biu Music · 63 首 · 2024-09-21", tag: "歌单", badge: "收藏夹" },
          ].map((item, index) => (
            <AlbumCard
              key={item.title}
              title={item.title}
              tag={<Tag variant="plain">{item.tag}</Tag>}
              meta={item.meta}
              artKey={`album-${index}`}
              badge={item.badge}
              ratioNote="118 × 118"
              footer={
                <>
                  <Button variant="ghost" icon="play">
                    播放
                  </Button>
                  <Button variant="ghost" icon="queue-add">
                    入队
                  </Button>
                </>
              }
            />
          ))}
        </AlbumGrid>
      </Showcase>

      <Showcase
        name="格式卡与栅格"
        proto=".format-grid / .format-card / .format-name / .format-title / .format-meta"
        page={5}
        note="「本地音乐不做封面匹配」这个产品决策的视觉落地：载体是格式 + 文件名 + 目录这套真实元数据，所以卡片更「文档感」—— 30px 数字字体的格式名打头。徽标挂**右上**（原型里唯一一个），不要顺手对齐到左上。栅格 2 列、间距 20、上边距 36（原型尾部覆盖值）。"
      >
        <FormatGrid>
          <FormatCard
            format="flac"
            title="夜航（Live 版）"
            meta="04:15 · 38.4 MB · 创建于 2024-08-12"
            badge="D 盘 · Lossless"
          />
          <FormatCard
            format="wav"
            title="器乐练习 07"
            meta="06:02 · 62.1 MB · 创建于 2024-06-30"
            badge="D 盘 · Lossless"
          />
          <FormatCard
            format="mp3"
            title="深夜电台 0921"
            meta="03:48 · 8.7 MB · 创建于 2024-09-21"
            badge="E 盘 · Live 录音"
          />
          <FormatCard
            format="aiff"
            title="城市回声（母带）"
            meta="05:30 · 55.9 MB · 创建于 2023-11-04"
            badge="D 盘 · Lossless"
          />
          <FormatCard
            format="m4a"
            title="雨声采样 30min"
            meta="30:00 · 28.8 MB · 创建于 2024-03-17"
            badge="E 盘 · Live 录音"
          />
          <FormatCard
            format="wma"
            title="旧磁带转录 14"
            meta="04:41 · 11.2 MB · 创建于 2022-05-09"
            badge="E 盘 · Live 录音"
          />
        </FormatGrid>
      </Showcase>

      <Showcase
        name="创作者行"
        proto=".creator-row / .creator-face / .follow"
        page={7}
        note="**这一条同样被定义过两次**，生效值取文件末尾：列 107 / 1fr / 112、padding-right 0、关注按钮高 **34**、内边距 20（前一处是 32 / 16）。但前一处设的 border-top 与 gap 16 **没有被覆盖**，仍然生效。高度取 74：前一处 min-height 74 与后一处 height 56 并存时 min-height 更硬 —— 照后一处写 56 会与设计稿差 18px。关注按钮在原型里没有 :hover 规则，故如实不加悬停底色，可辨识性由 aria-pressed 与文字承担。"
      >
        <div className="flex flex-col">
          <CreatorRow
            name="潮汕好男人"
            meta="48.2 万粉丝 · 音乐区 UP · 已投稿 128 个视频"
            avatarKey="creator-a"
            followed
            onFollow={noop}
          />
          <CreatorRow
            name="琴键上的猫"
            meta="6.7 万粉丝 · 演绎区 UP · 已投稿 64 个视频"
            avatarKey="creator-b"
            followed={false}
            onFollow={noop}
          />
        </div>
      </Showcase>

      <Showcase
        name="行内进度"
        proto=".dl-status / .dl-label / .dl-bar / .progress-inline"
        page={6}
        note="两种排布来自两套原型类：stacked 是下载列（标签在上、条宽 220），inline 是行内（标签在条的右侧、条宽 190）。百分比缺省即「没有可量化进度」—— 原型的「已完成」与「任务出错」两行都只画标签、不画条。方案 §5.2 记的 state 属性**有意未实现**：原型的状态差异全部由标签文字承担，颜色与结构都不变；加 state 只会诱使人给「出错」染红，那是发明。"
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <InlineProgress label="下载中 · 62%" percent={62} />
            <InlineProgress label="合并分块中 · 40%" percent={40} />
            <InlineProgress label="已完成 · 可定位文件" />
            <InlineProgress label="任务出错 · 可重试" />
          </div>
          <div className="flex flex-col gap-6">
            <InlineProgress orientation="inline" label="62%" percent={62} />
            <InlineProgress orientation="inline" label="40%" percent={40} />
            <InlineProgress orientation="inline" label="0%" percent={0} />
            <InlineProgress orientation="inline" label="不存在负值 / 超界（自动夹紧）" percent={140} />
          </div>
        </div>
      </Showcase>

      <Showcase
        name="歌词面板"
        proto=".lyrics / .lyrics-head / .lyrics-line"
        page={11}
        note="材质是**凹槽**不是玻璃：底白 13%（surface-sunken）+ 玻璃描边 + 模糊 20。看到「有描边有模糊」就当玻璃去套是错误的，面板会比设计稿亮一档。行高 43 取原型尾部覆盖值（前一处是 1.7）：22px 字号配 43px 行高，切换高亮行时看起来是「移动」而不是「重排」。非当前行是 --biu-text-lyrics-dim **整值令牌**，不要再套 alpha —— 那是二次调暗，与设计稿的 56% 白不是一回事。"
      >
        <LyricsPanel
          head="歌词 · B站字幕（AI 兜底）· 逐行高亮"
          currentIndex={seekLine}
          onSeek={setSeekLine}
          lines={[
            "神呀 请接住她的眼泪吧",
            "夜色把整座城市折成一封信",
            "我把没说出口的 都唱给你听",
            "风穿过走廊 带走所有姓名",
            "如果回声也算回答",
          ]}
        />
        <p className="m-0 mt-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
          传入 onSeek 时每行是可点按钮（键盘可达）；不传则渲染为 <code>&lt;p&gt;</code> —— 不做成按钮，
          否则读屏用户要逐个 Tab 走过整段歌词。
        </p>
      </Showcase>

      <Showcase
        name="浮动弹层"
        proto=".modal / .modal--download / .btn-accent"
        page={3}
        note="底座是 HeroUI Modal（焦点陷阱、Esc、aria-modal、滚动锁定不是自己写能写对的），但**外观全部换成 C+ 材质**：底深灰 86%、描边白 14%、模糊 **28**（不是玻璃的 20）、投影、圆角 20、固定 560 × 153。六项里有四项与玻璃不同 —— 看到「有描边有模糊」就套玻璃，弹层会比设计稿亮一档、也不够「浮」。固定高度是设计决策：内容超长由调用方截断，让高度自适应等于放弃这条约束。"
      >
        <ExhibitRow>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            打开批量下载弹层
          </Button>
          <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
            原型没有关闭按钮（×），Esc 与点遮罩仍然可用。
          </span>
        </ExhibitRow>
        <Dialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          title="批量下载音频"
          sub="先选音质与范围，再统一入队（download-select-modal）"
          lines={[
            "音质：自动 30232 · 高清 30280 · 无损 30251 · 杜比 30250",
            "范围：全部 214 首 · 仅已选 12 首 · 跳过已下载",
          ]}
          footer={<DialogAction onPress={() => setDialogOpen(false)}>加入下载队列</DialogAction>}
        />
      </Showcase>
    </ExhibitSection>
  );
};
