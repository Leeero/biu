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
  title: string;
  lead: string;
  filters: DiscoverFilter[];
  /**
   * 语义筛选控件。**传了它就用它替代 `filters` 的默认渲染。**
   *
   * 真实路径用它传入 `SegmentedControl`：「音乐分区 / 新碟与新歌」是**互斥二选一**
   * 的数据源，分段控件才有这个语义 —— 激活项反色、方向键在两档间循环、
   * 读屏听到的是「已选中」而不是「又一个按钮」。用一排并列药丸表达互斥关系，
   * 用户只能靠颜色猜哪个是当前的。
   *
   * 夹具路径**不传**，走 `filters` 的静态药丸渲染（那一屏的 5 枚药丸是
   * 「全部播放 / 随机播放 / 数据源 · … / 去重后合并 27 条 / 显示模式 · 卡片」，
   * 本来就不是互斥选项，不该被强行改成分段）。
   */
  filterControl?: ReactNode;
  /**
   * 头部右上角的"视图切换"控件。**与语义筛选刻意分开**：
   * 语义筛选决定「显示什么内容」，视图切换决定「怎么呈现」。两者被错放在
   * 同一组 Pill 里时，用户既会以为视图切换是另一种数据源，又会被它与语义
   * Pill 相同的视觉权重抢走注意力。调用方传入任意 ReactNode（典型是
   * `SegmentedControl` 或一对图标按钮），不传则头部只有筛选条。
   */
  viewSwitcher?: ReactNode;
  /**
   * 内容区。**传了它就用它替代 `hero` 与专辑网格两整段。**
   *
   * 存在的理由：切换数据源（"音乐分区 / 新碟与新歌"）时**页头必须常驻**。
   * 若像早先那样让页面在 loading / error / empty 时整个早退成 `<PageState>`，
   * 页头连同分段控件一起被卸载重建 —— 每次点击都闪一下，而且刚点下去的那一档
   * 在视觉上"消失"了半秒，用户会以为自己点空了。
   *
   * 正确做法是**骨架常驻、只有数据区换状态**：页头（H1 / 导语 / 两个分段控件）
   * 始终挂载，加载态只落在它下面的内容区。调用方在 loading / error / empty
   * 时往这里传 `<PageState>`，`ready` 时**不传**（走 `hero` + `albums` 的正常渲染）。
   */
  content?: ReactNode;
  heroSectionTitle: string;
  hero: DiscoverHero | null;
  albumSectionTitle: string;
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

export const DiscoverView = (props: DiscoverViewProps) => {
  const { title, lead, filters, filterControl, viewSwitcher, content, hero, albumSectionTitle, albums, children } =
    props;
  return (
    <div className="discover4188">
      {/* 页头与列表分支**同一个组件**（`DiscoverHeading`）：两个展示模式的页头
          几何因此只有一处描述，不可能再漂移。 */}
      <DiscoverHeading
        title={title}
        lead={lead}
        filters={filters}
        filterControl={filterControl}
        viewSwitcher={viewSwitcher}
        onPillPress={filter => filter.onPress?.()}
      />
      {/*
        页头之后是内容区。**给了 `content` 就整段替换**（hero + 专辑网格都不渲染），
        这样加载 / 失败 / 空态只换这一块，页头与两个分段控件始终挂载 —— 切换数据源
        时不会闪。详见 `DiscoverViewProps.content`。
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
            <div className="discover4188-section-head">
              <h2>{albumSectionTitle}</h2>
            </div>
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
