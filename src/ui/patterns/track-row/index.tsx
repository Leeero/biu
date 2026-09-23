import type { ContextMenuItem } from "@/components/context-menu";
import type { Track } from "@/domain/track";

import MusicListItem from "@/components/music-list-item";

interface TrackRowProps {
  track: Track;
  index?: number;
  compact?: boolean;
  hidePublishedAt?: boolean;
  actions?: ContextMenuItem[];
  onAction?: (key: string) => void;
  onPlay?: () => void;
}

const noActions: ContextMenuItem[] = [];

export const TrackRow = ({ track, index, hidePublishedAt, actions = noActions, onAction, onPlay }: TrackRowProps) => (
  <MusicListItem
    title={track.title}
    type={track.source === "bilibili-video" ? "mv" : "audio"}
    bvid={track.sourceRef.bvid}
    sid={track.sourceRef.sid}
    cover={track.cover}
    upName={track.creator?.name}
    upMid={track.creator?.id ? Number(track.creator.id) || undefined : undefined}
    playCount={track.playCount}
    duration={track.duration}
    index={index}
    pubTime={track.publishedAt?.slice(0, 10)}
    hidePubTime={hidePublishedAt}
    menus={actions}
    onMenuAction={onAction}
    onPress={onPlay}
  />
);
