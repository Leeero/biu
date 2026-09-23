import type { Track } from "@/domain/track";
import type { FavResourceInfo } from "@/service/fav-resource-infos";

export const adaptFavoriteResourceToTrack = (item: FavResourceInfo): Track | undefined => {
  if (item.attr !== 0 || ![2, 12].includes(item.type)) return undefined;
  const isVideo = item.type === 2;
  const bvid = item.bvid || item.bv_id || undefined;
  if (isVideo && !bvid) return undefined;

  return {
    id: isVideo ? `bilibili-video:${bvid}` : `bilibili-audio:${item.id}`,
    source: isVideo ? "bilibili-video" : "bilibili-audio",
    title: item.title,
    cover: item.cover,
    creator: item.upper ? { id: String(item.upper.mid), name: item.upper.name, avatar: item.upper.face } : undefined,
    duration: item.duration,
    playCount: item.cnt_info?.play,
    publishedAt: item.pubtime ? new Date(item.pubtime * 1000).toISOString() : undefined,
    sourceRef: isVideo ? { aid: String(item.id), bvid } : { sid: item.id },
  };
};

export const adaptFavoriteResourcesToTracks = (items: FavResourceInfo[]) =>
  items.map(adaptFavoriteResourceToTrack).filter((track): track is Track => Boolean(track));
