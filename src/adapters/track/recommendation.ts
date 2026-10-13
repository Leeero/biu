import type { Track } from "@/domain/track";
import type { Data as RankItem } from "@/service/music-comprehensive-web-rank";
import type { Archive as RegionArchive } from "@/service/web-interface-region-feed-rcmd";

const creator = (id?: number | string, name?: string) => {
  if (id === undefined && !name) return undefined;
  return {
    id: id === undefined ? `name:${name}` : String(id),
    name: name || "未知创作者",
  };
};

const videoTrackId = ({ bvid, aid, fallback }: { bvid?: string; aid?: string | number; fallback: string }) => {
  if (bvid) return `bilibili-video:${bvid}`;
  if (aid !== undefined && aid !== "") return `bilibili-video:av${aid}`;
  return `recommendation:${fallback}`;
};

/**
 * 本文件只保留**仍被消费**的适配器。「新碟与新歌」相关适配器
 * （`adaptNewMusicToTrack` / `adaptNewMusicBannerToTrack` / `dedupeTracks`）已随
 * 2026-10-12 的产品决策移除：发现音乐页收敛为单一的「音乐分区」数据源，
 * `centralization/interface/new/music` 系接口不再被消费。
 */

export const adaptRegionArchiveToTrack = (item: RegionArchive, fallback: string): Track => ({
  id: videoTrackId({ bvid: item.bvid, aid: item.aid, fallback }),
  source: "bilibili-video",
  title: item.title || "未命名内容",
  cover: item.cover,
  creator: creator(item.author?.mid, item.author?.name),
  duration: item.duration,
  playCount: item.stat?.view,
  publishedAt: item.pubdate ? new Date(item.pubdate * 1000).toISOString() : undefined,
  sourceRef: {
    aid: item.aid === undefined ? undefined : String(item.aid),
    bvid: item.bvid,
    cid: item.cid === undefined ? undefined : String(item.cid),
  },
});

export const adaptRankItemToTrack = (item: RankItem, fallback: string): Track => {
  const archive = item.related_archive;
  const aid = archive?.aid || item.aid;
  const bvid = archive?.bvid || item.bvid;

  return {
    id: videoTrackId({ bvid, aid, fallback }),
    source: "bilibili-video",
    title: archive?.title || item.music_title || "未命名内容",
    cover: archive?.cover || item.cover,
    creator: creator(archive?.uid, archive?.username || item.author),
    duration: archive?.duration,
    playCount: archive?.vv_count,
    sourceRef: {
      aid: aid ? String(aid) : undefined,
      bvid: bvid || undefined,
      cid: archive?.cid || item.cid || undefined,
    },
  };
};
