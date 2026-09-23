import type { Track } from "@/domain/track";
import type { Data as RankItem } from "@/service/music-comprehensive-web-rank";
import type { List as NewMusicItem } from "@/service/web-interface-new-music";
import type { List as NewMusicBannerItem } from "@/service/web-interface-new-music-banner";
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

export const adaptNewMusicToTrack = (item: NewMusicItem, fallback: string): Track => ({
  id: videoTrackId({ bvid: item.bvid, aid: item.aid, fallback }),
  source: "bilibili-video",
  title: item.music_title || "未命名内容",
  cover: item.cover,
  creator: creator(undefined, item.author),
  playCount: item.total_vv,
  publishedAt: item.publish_time,
  sourceRef: {
    aid: item.aid,
    bvid: item.bvid,
    cid: item.cid,
  },
});

export const adaptNewMusicBannerToTrack = (item: NewMusicBannerItem, fallback: string): Track => ({
  id: videoTrackId({ bvid: item.bvid, aid: item.aid, fallback }),
  source: "bilibili-video",
  title: item.archive_title || "未命名内容",
  cover: item.cover,
  creator: creator(undefined, item.author),
  publishedAt: item.publish_time,
  sourceRef: {
    aid: item.aid === undefined ? undefined : String(item.aid),
    bvid: item.bvid,
    cid: item.cid === undefined ? undefined : String(item.cid),
  },
});

/** 合并推荐区块时按领域 ID 去重，并保持服务端原有顺序。 */
export const dedupeTracks = (tracks: Track[]) => {
  const seen = new Set<string>();
  return tracks.filter(track => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
};
