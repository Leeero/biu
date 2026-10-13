import type { CSSProperties, ReactNode } from "react";

import { RiPauseLargeFill, RiPlayLargeFill } from "@remixicon/react";

import type { IconName } from "@/ui/primitives/icon";
import type { PillVariant } from "@/ui/primitives/pill";
import type { TagVariant } from "@/ui/primitives/tag";

import { DiscoverHeading } from "./discover-heading";
export interface DiscoverTag {
  key: string;
  label: string;
  variant: TagVariant;
}
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
  badge: string;
  ratioNote: string;
  tag: string;
  title: string;
  meta: string;
  tags: DiscoverTag[];
  artVariant?: "heroCard" | "heroList";
  art?: string;
  artPlaceholder?: string;
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
  artPlaceholder?: string;
  duration?: string;
  current?: boolean;
  onPlay?: () => void;
}
export interface DiscoverViewProps {
  /**
   * 页头标题。**不传则整块页头（H1 + 导语 + 筛选条）不渲染。**
   *
   * 真实路径（发现音乐）自 2026-10-12 起不再传它：产品要求页面「只展示内容」，
   * H1「发现音乐」/ 导语 / 「音乐分区推荐」段落标题都已移除 —— 当前所在页面由
   * 侧栏高亮表达，页头只重复了一遍导航信息，还占掉了首屏一整块高度。
   * 夹具屏（屏 07 / 08）仍传，它们是**设计稿存档**，页头是那两屏的既有内容。
   */
  title?: string;
  lead?: ReactNode;
  filters?: DiscoverFilter[];
  /**
   * 内容区。**传了它就用它替代 `hero` 与专辑网格两整段。**
   *
   * 存在的理由：加载 / 失败 / 空态时**页头必须常驻**。若像早先那样让页面在
   * loading / error / empty 时整个早退成 `<PageState>`，页头（H1 / 导语）连同
   * 筛选条一起被卸载重建 —— 点"重新加载"时会闪一下。
   *
   * 正确做法是**骨架常驻、只有数据区换状态**：页头始终挂载，加载态只落在它下面的
   * 内容区。调用方在 loading / error / empty 时往这里传 `<PageState>`，
   * `ready` 时**不传**（走 `hero` + `albums` 的正常渲染）。
   */
  content?: ReactNode;
  heroSectionTitle?: string;
  hero: DiscoverHero | null;
  /** 段落标题。**不传则不渲染那一行**（真实路径已移除，只展示卡片网格）。 */
  albumSectionTitle?: string;
  albums: DiscoverAlbum[];
  note?: string;
  children?: ReactNode;
}
export const DISCOVER_RHYTHM = {
  leadMarginTop: 18,
  filterMarginTop: 13,
  sectionGap: 25,
  sectionHeadMarginBottom: 3,
} as const;

/**
 * 页头渲染的几何与取径见 `DiscoverHeading`。本组件只决定**要不要**有页头：
 * `title` 缺席即整块不渲染（真实路径），见 `DiscoverViewProps.title`。
 */
export const DiscoverView = (props: DiscoverViewProps) => {
  const { title, lead, filters, content, hero, albumSectionTitle, albums, children } = props;
  return (
    <div className={title ? "discover4188" : "discover4188 is-headless"}>
      {title && (
        /* 页头与列表分支**同一个组件**（`DiscoverHeading`）：两个展示模式的页头
           几何因此只有一处描述，不可能再漂移。 */
        <DiscoverHeading title={title} lead={lead} filters={filters ?? []} onPillPress={filter => filter.onPress?.()} />
      )}
      {/*
        页头之后是内容区。**给了 `content` 就整段替换**（hero + 专辑网格都不渲染），
        这样加载 / 失败 / 空态只换这一块，页头始终挂载 —— 点"重新加载"时页面不闪。
        详见 `DiscoverViewProps.content`。
      */}
      {content ?? (
        <>
          {hero && (
            <section
              className="discover4188-hero"
              style={hero.artPlaceholder ? ({ "--discover-art": hero.artPlaceholder } as CSSProperties) : undefined}
            >
              {hero.art && <img src={hero.art} alt={`${hero.title}封面`} />}
              <span className="discover4188-hero-badge">{hero.badge}</span>
              <span className="discover4188-hero-ratio">{hero.ratioNote}</span>
              <div className="discover4188-hero-shade" />
              <div className="discover4188-hero-copy">
                <span>{hero.tag}</span>
                <h2>{hero.title}</h2>
                <h3>{hero.meta}</h3>
                <div className="discover4188-hero-tags">
                  {hero.tags.map(tag => (
                    <small key={tag.key}>{tag.label}</small>
                  ))}
                </div>
                <button type="button" onClick={hero.onPlay}>
                  <RiPlayLargeFill size={20} />
                  立即播放
                </button>
              </div>
            </section>
          )}
          <section className="discover4188-section">
            {albumSectionTitle && (
              <div className="discover4188-section-head">
                <h2>{albumSectionTitle}</h2>
              </div>
            )}
            <div className="discover4188-grid">
              {albums.map(album => (
                <article
                  key={album.key}
                  className={album.current ? "discover4188-card is-playing" : "discover4188-card"}
                  aria-current={album.current || undefined}
                >
                  <div className="discover4188-art">
                    {album.art ? (
                      <img src={album.art} alt={`${album.title}封面`} />
                    ) : (
                      <span
                        className="discover4188-art-fallback"
                        style={
                          album.artPlaceholder
                            ? ({ "--discover-art": album.artPlaceholder } as CSSProperties)
                            : undefined
                        }
                      />
                    )}
                    {album.current && <span className="discover4188-playing">播放中</span>}
                    <button
                      type="button"
                      aria-label={`${album.current ? "暂停" : "播放"} ${album.title}`}
                      onClick={album.onPlay}
                    >
                      {album.current ? <RiPauseLargeFill size={22} /> : <RiPlayLargeFill size={22} />}
                    </button>
                    {album.duration && <time>{album.duration}</time>}
                  </div>
                  <strong>{album.title}</strong>
                  <span>{album.meta}</span>
                  <small>{album.badge}</small>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {children}
    </div>
  );
};
