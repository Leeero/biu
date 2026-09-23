import type { CreatorSummary } from "@/domain/creator";
import type { PlaylistSummary } from "@/domain/playlist";
import type { Track } from "@/domain/track";
import type { SeriesArchive } from "@/service/series-archives";
import type { SeriesMeta } from "@/service/series-info";

export const adaptSeriesMetaToPlaylist = (meta: SeriesMeta): PlaylistSummary => ({
  id: `series:${meta.series_id}`,
  source: "series",
  title: meta.name,
  cover: meta.cover,
  creator: { id: String(meta.mid), name: meta.creator || "未知创作者" },
  trackCount: meta.total,
});

export const adaptSeriesArchiveToTrack = (archive: SeriesArchive, creator?: CreatorSummary): Track => ({
  id: `bilibili-video:${archive.bvid}`,
  source: "bilibili-video",
  title: archive.title,
  cover: archive.pic,
  creator,
  duration: archive.duration,
  playCount: archive.stat?.view,
  publishedAt: archive.pubdate ? new Date(archive.pubdate * 1000).toISOString() : undefined,
  sourceRef: { aid: String(archive.aid), bvid: archive.bvid },
});
