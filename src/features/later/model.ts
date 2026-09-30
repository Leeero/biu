import moment from "moment";

import type { ToViewVideoItem } from "@/service/history-toview-list";

import { adaptWatchLaterToTrack } from "@/adapters/track/watch-later";
import { formatNumber } from "@/common/utils/number";
import { formatDuration } from "@/common/utils/time";

export const formatWatchProgress = (progress: number, duration: number) => {
  if (progress <= 0 || duration <= 0) return { label: "未看" };
  if (progress >= duration) return { label: formatDuration(duration), percent: 100 };
  const percent = Math.min(99, Math.max(1, Math.round((progress / duration) * 100)));
  return { label: `${percent}%`, percent };
};

export const adaptWatchLaterEntry = (item: ToViewVideoItem, index: number) => {
  const track = adaptWatchLaterToTrack(item);
  const progress = formatWatchProgress(item.progress, item.duration);
  const addedAt = item.add_at ? moment.unix(item.add_at).format("MM-DD HH:mm") : "加入时间未知";
  const category = item.tname || "B 站视频";
  const part = `分P 1/${Math.max(1, item.videos || 1)}`;
  const plays = typeof item.stat?.view === "number" ? ` · ${formatNumber(item.stat.view)} 播放` : "";

  return {
    id: track.id,
    index: index + 1,
    title: track.title,
    subtitle: `${category} · ${part}${plays}`,
    cell: `@${track.creator?.name || "未知 UP 主"} · ${addedAt}`,
    progress: progress.label,
    progressPercent: progress.percent,
    art: track.cover,
    artKey: track.id,
    track,
    source: item,
  };
};

export type WatchLaterEntry = ReturnType<typeof adaptWatchLaterEntry>;
