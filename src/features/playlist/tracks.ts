import type { Track } from "@/domain/track";
import type { Media } from "@/service/user-video-archives-list";

export const adaptCollectionMediaToTrack = (item: Media): Track => ({
  id: `bilibili-video:${item.bvid}`,
  source: "bilibili-video",
  title: item.title,
  cover: item.cover,
  creator: item.upper ? { id: String(item.upper.mid), name: item.upper.name } : undefined,
  duration: item.duration,
  playCount: item.cnt_info?.play,
  publishedAt: item.pubtime ? new Date(item.pubtime * 1000).toISOString() : undefined,
  sourceRef: { aid: String(item.id), bvid: item.bvid },
});
