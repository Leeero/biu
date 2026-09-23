import type { Track } from "@/domain/track";
import type { SpaceArcVListItem } from "@/service/space-wbi-arc-search";

const parseDuration = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  return parts.reduce((total, part) => total * 60 + part, 0);
};

/** 将创作者发布内容接入播放器统一的 Track 领域模型。 */
export const adaptCreatorPostToTrack = (item: SpaceArcVListItem): Track => ({
  id: `bilibili-video:${item.bvid}`,
  source: "bilibili-video",
  title: item.title,
  cover: item.pic,
  creator: { id: String(item.mid), name: item.author },
  duration: parseDuration(item.length),
  playCount: item.play,
  publishedAt: item.created ? new Date(item.created * 1000).toISOString() : undefined,
  sourceRef: { aid: String(item.aid), bvid: item.bvid },
});
