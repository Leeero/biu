import type { Track } from "@/domain/track";
import type { ToViewVideoItem } from "@/service/history-toview-list";

/** 将 B 站稍后再看条目接入统一 Track 领域模型。 */
export const adaptWatchLaterToTrack = (item: ToViewVideoItem): Track => ({
  id: `bilibili-video:${item.bvid}`,
  source: "bilibili-video",
  title: item.title,
  cover: item.pic,
  creator: item.owner ? { id: String(item.owner.mid), name: item.owner.name } : undefined,
  duration: item.duration,
  playCount: item.stat?.view,
  publishedAt: item.pubdate ? new Date(item.pubdate * 1000).toISOString() : undefined,
  sourceRef: {
    aid: String(item.aid),
    bvid: item.bvid,
    cid: String(item.cid),
  },
});
