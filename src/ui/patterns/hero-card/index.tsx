import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Artwork } from "@/ui/primitives/artwork";
import { Badge, type BadgeVariant } from "@/ui/primitives/badge";
import { GlassButton } from "@/ui/primitives/glass-button";
import { Tag, type TagVariant } from "@/ui/primitives/tag";

interface HeroCardTag {
  key: string;
  label: ReactNode;
  variant?: TagVariant;
}

interface HeroCardProps {
  title: ReactNode;
  /** 副信息行（创作者 · 播放量 · 时长）。原型 `.hero-meta`。 */
  meta?: ReactNode;
  /** 标题上方的属性标签（原型 `.hero-body .tag`，下边距取 `--biu-layout-hero-tag-gap`）。 */
  tag?: ReactNode;
  /** 标题下方的标签组（原型 `.hero-tags`，上边距取 `--biu-layout-hero-tags-gap`、间距 8）。 */
  tags?: readonly HeroCardTag[];
  art?: string;
  artKey?: string;
  /**
   * 封面占位渐变档。
   *
   * `heroCard` 是**卡片分支**（屏 07），`heroList` 是**列表分支**（屏 08）——
   * 两者是设计稿里的两条固定渐变（取值在 `placeholder-art.ts`，属数据夹具）。
   * 默认取 `heroCard`（组件名即卡片），列表分支须显式传 `heroList`。
   */
  artVariant?: "heroCard" | "heroList";
  /** 封面左上角徽标（原型 `.hero-art .badge`）。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  /** 封面左下角的画幅说明（原型 `.hero-art .ratio-note`）。大卡**有**此说明（与专辑卡相反）。 */
  ratioNote?: ReactNode;
  onPlay?: () => void;
  /** 无 `onPlay` 时不渲染播放键（原型里它恒在，留给只读展示的调用方关掉）。 */
  playLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * 发现音乐大卡（原型 `.hero-card` 及其子元素）。
 *
 * 几何：三列 `--biu-layout-hero-art-w | minmax(0,1fr) | --biu-layout-hero-play-w`
 * （356 / 1fr / 128）、间距 24、内边距 15、圆角 20、白 6% 底 + 白 6% 描边。
 * 第三列是**播放键的槽位**（宽 128，键 56 贴右缘），所以播放键不是绝对定位，
 * 而是 grid 的一列 —— 这在窄容器下会自动收窄，改成绝对定位就会压到文案上。
 *
 * 正文列**顶对齐**（`self-start` + `--biu-layout-hero-body-pt` 22），
 * **不是** `items-center` 居中：设计稿的首元素盒顶落在内容盒顶 + 22，而居中所
 * 依赖的「正文列自然高」在设计稿里不可观测（1.3.20）。详见该令牌处的注释。
 *
 * **这四组值与原型都不同**（原型 `assets/app.css:1533` 是 353 | 1fr | 128 /
 * gap 20 / padding 17px 16px，标签三处间距 8 / 4 / 24），实现按设计稿第 8 页：
 * 三列 356、间距 24、内边距 15、芯片 25 高 / 内距 12、芯片→标题 15、
 * 标题→元信息 7、元信息→标签 17；字号标题 **26** / 行盒 38、meta **15** / 行盒 20
 * （1.3.19 按字形间距重定，此前误记 30 / 13）。逐项取证见 spec-lock `geometry.heroCard`。
 *
 * 封面用 `Artwork` 的 `heroCard` / `heroList` 占位：设计稿在卡片分支与列表分支
 * 用了两条不同的固定渐变（卡片分支更暗、列表分支偏蓝），两者都是数据夹具里
 * 的登记值，不是设计令牌。
 */
export const HeroCard = ({
  title,
  meta,
  tag,
  tags,
  art,
  artKey,
  artVariant = "heroCard",
  badge,
  badgeVariant = "default",
  ratioNote,
  onPlay,
  playLabel = "播放",
  children,
  className,
}: HeroCardProps) => (
  <article
    className={twMerge(
      "relative grid grid-cols-[var(--biu-layout-hero-art-w)_minmax(0,1fr)_var(--biu-layout-hero-play-w)] items-center",
      "gap-[var(--biu-layout-hero-gap)] rounded-[var(--biu-radius-lg)] border border-[var(--biu-border-weak)]",
      "bg-[var(--biu-surface-raised)] p-[var(--biu-layout-hero-pad)]",
      className,
    )}
  >
    <div className="relative isolate aspect-video overflow-hidden rounded-[var(--biu-radius-md)]">
      <Artwork
        src={art}
        artKey={artKey}
        alt=""
        radius="none"
        gradient={artVariant}
        className="absolute inset-0 h-full w-full"
      />
      {badge && (
        <Badge
          variant={badgeVariant}
          className="absolute top-[var(--biu-layout-hero-badge-inset)] left-[var(--biu-layout-hero-badge-inset)] z-[2]"
        >
          {badge}
        </Badge>
      )}
      {ratioNote !== undefined && ratioNote !== null && (
        <span className="absolute bottom-[var(--biu-layout-hero-ratio-bottom)] left-[var(--biu-layout-hero-ratio-left)] z-[2] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
          {ratioNote}
        </span>
      )}
    </div>

    {/*
      正文列**不参与** `items-center`：设计稿要求首元素盒顶落在内容盒顶 + 22
      （`--biu-layout-hero-body-pt`）。原型的 `align-items: center` 之所以看起来
      「也行」，是因为设计稿的正文列比实现的自然高多出约 10.6 —— 那 10.6 藏在
      包装层的下间距里、稿面上不可见（见 spec-lock `geometry.heroCard` 的取证段）。
      这里按可观测的结论显式定位，`self-start` 覆盖掉 grid 的居中。
    */}
    <div className="mt-[var(--biu-layout-hero-body-pt)] min-w-0 self-start">
      {/*
        `flex` 不是排版偏好：块级容器里的 `inline-flex` 芯片会生成一个**行盒**，
        行盒把芯片往下推 1.5px（行内文本的上承载），于是「首元素盒顶」变成依赖
        字体度量的隐含量。改 `flex` 后包装层高 = 芯片高，偏移令牌才可被直接验证。
      */}
      {tag && <div className="mb-[var(--biu-layout-hero-tag-gap)] flex">{tag}</div>}
      {/*
        标题 26px / 行盒 38、meta 15px / 行盒 20（= `--biu-type-body` 档）。
        **字号由字形段起点间距定**（spec-lock 1.3.19）：1.3.16 登记的 30 / 13 是从
        墨迹盒高反推的，同一段文字换阈值就能差 2 行。行盒 38 / 20 与三个间距
        （15 / 7 / 17）的锚点是「标题盒顶」，与盒内字号无关，故一字未改。
      */}
      <h3 className="m-0 text-[26px] leading-[38px] font-semibold tracking-[-0.5px] text-[rgb(var(--biu-text-primary))]">
        {title}
      </h3>
      {meta !== undefined && meta !== null && (
        <p className="m-0 mt-[var(--biu-layout-hero-meta-gap)] text-[length:var(--biu-type-body-size)] leading-5 text-[rgb(var(--biu-text-secondary))]">
          {meta}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-[var(--biu-layout-hero-tags-gap)] flex flex-wrap gap-2">
          {tags.map(item => (
            <Tag key={item.key} variant={item.variant} size="lg">
              {item.label}
            </Tag>
          ))}
        </div>
      )}
      {children}
    </div>

    {onPlay && (
      <GlassButton
        tone="inverse"
        size={56}
        iconSize={26}
        label={playLabel}
        icon="play"
        onClick={onPlay}
        className="justify-self-end"
      />
    )}
  </article>
);
