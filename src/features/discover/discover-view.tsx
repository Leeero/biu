import type { ReactNode } from "react";

import type { IconName } from "@/ui/primitives/icon";
import type { PillVariant } from "@/ui/primitives/pill";
import type { TagVariant } from "@/ui/primitives/tag";

import { AlbumCard, AlbumGrid } from "@/ui/patterns/album-card";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { HeroCard } from "@/ui/patterns/hero-card";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import { Button } from "@/ui/primitives/button";
import { Pill } from "@/ui/primitives/pill";
import { Tag } from "@/ui/primitives/tag";

/**
 * 屏 07「发现音乐 · 卡片」的屏级节奏。
 *
 * 四个值全部来自 spec-lock `screens[06].rhythmImplementation`（1.3.17 登记、
 * 1.3.18 补 `h1Baseline`），是**设计稿第 8 页的实测值**，逐屏不同 ——
 * 相邻的第 9 页（屏 08）导语**高** 10px（192 对 202）、筛选条**高** 3px（236 对 239），
 * 故**屏 08 另有一组自己的值**（`screens[07].rhythmImplementation`：导语 8 / 筛选条 20 /
 * 段距 20），本屏这一组不得下发给它。它们不进组件的档位表
 * （档位是跨屏复用的档），而是由本文件按屏下发给 `PageHeader` / `FilterBar` /
 * `Section` 的像素覆写入参。
 *
 * `h1Baseline` 那条尤其要留意：真值里写的 `head-main--flat` 是**原型类名**，
 * 它在实现里的效果是去掉标题列的 11px 基线、把 H1 压到 111（比设计稿的 121
 * 高 10px，正是 `prototypeBaseline` 记的「原型整体高 10」的成因）。
 * 正确的落法是 `aligned`（`PageHeader` 的缺省），四个后续值只有挂在它上面才闭合：
 * H1 盒顶 115 → 墨迹 122 → +65+18 → 导语 202 → +28+13 → 筛选条 239。
 */
export const DISCOVER_RHYTHM = {
  /** 导语上边距。缺省档 `low` 是 14，本屏实测 18。 */
  leadMarginTop: 18,
  /** 筛选条上边距。最近的档 `flat` 是 15，本屏实测 13。 */
  filterMarginTop: 13,
  /** 段间距，**同时**是「筛选条 → 首段」与「段 → 段」（缺省档分别是 20 与 27）。 */
  sectionGap: 25,
  /** 分组标题下距。缺省 8，本屏实测 3。 */
  sectionHeadMarginBottom: 3,
} as const;

/** 属性标签。`variant` 由设计稿实测底色反解（见夹具模块的说明）。 */
export interface DiscoverTag {
  key: string;
  label: string;
  variant: TagVariant;
}

/**
 * 筛选条里的一枚药丸。
 *
 * 有 `onPress` 的渲染成 `Button`（可交互），没有的渲染成 `Pill`（静态标记）——
 * 「数据源 · 新碟 banner + 分区推荐」「去重后合并 27 条」是**状态标记**，
 * 把它们做成按钮就是发明一个点了没反应的控件（与 `SegmentItem.pending` 同一条纪律）。
 */
export interface DiscoverFilter {
  key: string;
  label: string;
  variant: PillVariant;
  icon?: IconName;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export interface DiscoverHero {
  /** 封面左上角徽标。 */
  badge: string;
  /** 封面左下角画幅说明。大卡**有**（与专辑卡相反）。 */
  ratioNote: string;
  /** 标题上方的强调芯片。 */
  tag: string;
  title: string;
  meta: string;
  tags: DiscoverTag[];
  /**
   * 封面占位档。`heroCard` 是卡片分支（本屏）、`heroList` 是列表分支（屏 08）。
   * 真实路径有封面 URL 时走 `art`，夹具走这个档。
   */
  artVariant?: "heroCard" | "heroList";
  art?: string;
  artKey?: string;
  onPlay?: () => void;
}

export interface DiscoverAlbum {
  key: string;
  badge: string;
  title: string;
  meta: string;
  tags: DiscoverTag[];
  art?: string;
  artKey?: string;
  /** 显式占位底图（夹具逐字对齐用）。见 `Artwork.placeholder`。 */
  artPlaceholder?: string;
}

export interface DiscoverViewProps {
  title: string;
  lead: string;
  filters: DiscoverFilter[];
  heroSectionTitle: string;
  /** 首段内容。真实路径拿不到 banner 时为 `null`，整段不渲染。 */
  hero: DiscoverHero | null;
  albumSectionTitle: string;
  albums: DiscoverAlbum[];
  /**
   * 注解带文字。
   *
   * 本屏的注解带**按页流**排在内容之后（`anchor="inline"`），不做成贴视口底的
   * 固定带 —— 设计页第 8 页的画板高 978，那段注解在 900 视口折线**以下**；
   * 做成固定带会让 900 视口里多出一条设计页上看不见的注解（spec-lock
   * `screens[06].verticalRhythmRule`）。
   *
   * 与网格的间距**未经像素校验**（那段在折线以下，探针测不到），沿用组件既有的
   * `mt-6`。不要照画板坐标反推一个「精确值」出来 —— 那是从一个观测不到的
   * 位置倒推的。
   */
  note: string;
  /** 专辑网格之后的内容（真实路径的分区推荐列表与状态位）。 */
  children?: ReactNode;
}

/**
 * 「发现音乐」的呈现层（C+ 第 07 屏，卡片分支）。
 *
 * 数据装配在 `pages/music-recommend` —— 真实路径与 `?fixture=07-discover-card`
 * 夹具路径在这里汇成同一组 props，渲染代码只有一份。结构对齐设计稿第 8 页：
 * 单列页头（H1 + 导语 + 筛选条）→「精选 · 新碟 banner」大卡 →「新碟速报 ·
 * 方形专辑封面（new/music）」三列专辑卡 → 注解带。
 *
 * 页头是**单列**（没有右侧 `InfoPanel`）—— 设计稿本屏没有右栏，这与第 01 屏
 * 的两栏页头不同，所以这里不给 `aside`。
 */
export const DiscoverView = ({
  title,
  lead,
  filters,
  heroSectionTitle,
  hero,
  albumSectionTitle,
  albums,
  note,
  children,
}: DiscoverViewProps) => (
  <div className="w-full">
    <PageHeader title={title} lead={lead} leadOffsetPx={DISCOVER_RHYTHM.leadMarginTop}>
      <FilterBar label="发现音乐筛选" gapPx={DISCOVER_RHYTHM.filterMarginTop}>
        {filters.map(item =>
          item.onPress ? (
            <Button
              key={item.key}
              variant={item.variant}
              icon={item.icon}
              trailing={item.trailing}
              disabled={item.disabled}
              onClick={item.onPress}
            >
              {item.label}
            </Button>
          ) : (
            <Pill key={item.key} variant={item.variant} icon={item.icon} trailing={item.trailing}>
              {item.label}
            </Pill>
          ),
        )}
      </FilterBar>
    </PageHeader>

    {hero && (
      <Section
        title={heroSectionTitle}
        gapPx={DISCOVER_RHYTHM.sectionGap}
        headMbPx={DISCOVER_RHYTHM.sectionHeadMarginBottom}
      >
        <HeroCard
          badge={hero.badge}
          ratioNote={hero.ratioNote}
          tag={
            /*
              信用芯片同样走 `lg` 档（25 高）：设计稿大卡内**上下两处芯片同为 25**
              —— 1.3.17 定的 `geometry.heroCard.tagHeight` 管的是「大卡内的芯片」，
              不是只管标题下方那一行。此前只给下方标签行加了 `lg`，这一枚仍是 22。
            */
            <Tag variant="accent" size="lg">
              {hero.tag}
            </Tag>
          }
          title={hero.title}
          meta={hero.meta}
          tags={hero.tags.map(item => ({ key: item.key, label: item.label, variant: item.variant }))}
          art={hero.art}
          artKey={hero.artKey}
          artVariant={hero.artVariant ?? "heroCard"}
          onPlay={hero.onPlay}
        />
      </Section>
    )}

    {albums.length > 0 && (
      <Section
        title={albumSectionTitle}
        gapPx={DISCOVER_RHYTHM.sectionGap}
        headMbPx={DISCOVER_RHYTHM.sectionHeadMarginBottom}
      >
        <AlbumGrid>
          {albums.map(album => (
            <AlbumCard
              key={album.key}
              badge={album.badge}
              title={album.title}
              meta={album.meta}
              art={album.art}
              artKey={album.artKey}
              artPlaceholder={album.artPlaceholder}
              footer={album.tags.map(item => (
                <Tag key={item.key} variant={item.variant}>
                  {item.label}
                </Tag>
              ))}
            />
          ))}
        </AlbumGrid>
      </Section>
    )}

    {children}

    <AnnotationBand anchor="inline">{note}</AnnotationBand>
  </div>
);
