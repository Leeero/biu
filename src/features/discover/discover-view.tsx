import type { CSSProperties, ReactNode } from "react";

import { RiPauseLargeFill, RiPlayLargeFill } from "@remixicon/react";

import type { IconName } from "@/ui/primitives/icon";
import type { PillVariant } from "@/ui/primitives/pill";
import type { TagVariant } from "@/ui/primitives/tag";
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
  const { title, lead, filters, hero, albumSectionTitle, albums, children } = props;
  return (
    <div className="discover4188">
      <header className="discover4188-heading">
        <div>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        <div className="discover4188-filters" aria-label="发现音乐筛选">
          {filters.map(filter => (
            <button
              key={filter.key}
              type="button"
              className={filter.variant === "primary" ? "is-active" : ""}
              disabled={filter.disabled}
              onClick={filter.onPress}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>
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
                      album.artPlaceholder ? ({ "--discover-art": album.artPlaceholder } as CSSProperties) : undefined
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
      {children}
    </div>
  );
};
