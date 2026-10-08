import type { PlayData } from "@/store/play-list";

import { formatDuration } from "@/common/utils/time";

export const getQueueIdentity = (item: PlayData) => {
  if (item.source === "local") return `local:${item.id}`;
  if (item.type === "mv") return `mv:${item.bvid}`;
  return `audio:${item.sid}`;
};

export const getUniqueQueueItems = (items: PlayData[]) => {
  const identities = new Set<string>();

  return items.filter(item => {
    const identity = getQueueIdentity(item);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
};

export interface QueueViewItem {
  item: PlayData;
  id: string;
  index: number;
  title: string;
  artist: string;
  duration: string;
  cover?: string;
  isCurrent: boolean;
  isNext: boolean;
  sourceLabel: string;
  partLabel?: string;
}

/** 抽屉、队列页和沉浸播放页共享的只读队列模型。 */
export const buildQueueViewModel = (items: PlayData[], playId?: string, nextId?: string) =>
  getUniqueQueueItems(items).map<QueueViewItem>((item, index) => ({
    item,
    id: item.id,
    index: index + 1,
    title: item.pageTitle || item.title,
    artist: item.source === "local" ? "本地音乐" : item.ownerName || "未知创作者",
    duration: item.duration ? formatDuration(item.duration) : "--:--",
    cover: item.pageCover || item.cover,
    isCurrent: item.id === playId,
    isNext: item.id === nextId,
    sourceLabel: item.source === "local" ? "本地文件" : "音乐视频",
    partLabel: item.totalPage ? `多分P ${item.pageIndex}/${item.totalPage}` : undefined,
  }));
