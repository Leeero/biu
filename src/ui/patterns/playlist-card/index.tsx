import { RiPlayFill, RiPlayList2Line } from "@remixicon/react";

import type { PlaylistSummary } from "@/domain/playlist";

import Image from "@/components/image";

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  onPress?: () => void;
  onPlay?: () => void;
}

export const PlaylistCard = ({ playlist, onPress, onPlay }: PlaylistCardProps) => (
  <article className="group min-w-0">
    <div className="relative aspect-square overflow-hidden rounded-[var(--biu-radius-lg)] bg-[rgb(var(--biu-color-surface-raised))] shadow-[var(--biu-shadow-card)] transition-transform duration-[var(--biu-duration-normal)] group-hover:-translate-y-0.5">
      <button type="button" aria-label={`打开歌单 ${playlist.title}`} className="h-full w-full" onClick={onPress}>
        <Image
          removeWrapper
          src={playlist.cover}
          width="100%"
          height="100%"
          className="h-full w-full object-cover"
          emptyPlaceholder={<RiPlayList2Line size={32} />}
        />
      </button>
      {onPlay && (
        <button
          type="button"
          aria-label={`播放歌单 ${playlist.title}`}
          onClick={event => {
            event.stopPropagation();
            onPlay();
          }}
          className="bg-primary text-primary-foreground absolute right-3 bottom-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full opacity-0 shadow-[var(--biu-shadow-floating)] transition-[opacity,transform] duration-[var(--biu-duration-normal)] group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <RiPlayFill size={24} />
        </button>
      )}
    </div>
    <button type="button" className="mt-3 block w-full text-left" onClick={onPress}>
      <strong className="block truncate text-sm font-medium">{playlist.title}</strong>
      <span className="mt-1 block truncate text-xs text-[rgb(var(--biu-color-text-secondary))]">
        {[playlist.creator?.name, playlist.trackCount === undefined ? undefined : `${playlist.trackCount} 首`]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </button>
  </article>
);
