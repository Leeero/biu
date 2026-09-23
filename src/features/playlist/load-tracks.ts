import type { Track } from "@/domain/track";

import { adaptSeriesArchiveToTrack } from "@/adapters/playlist/series";
import { getAllFavTracks } from "@/common/utils/fav";
import { adaptCollectionMediaToTrack } from "@/features/playlist/tracks";
import { getSeriesArchives } from "@/service/series-archives";
import { getSeriesInfo } from "@/service/series-info";
import { getUserVideoArchivesList } from "@/service/user-video-archives-list";

export type PlaylistTrackSource = "favorite-folder" | "season" | "series";

export const loadAllPlaylistTracks = async (source: PlaylistTrackSource, id: string): Promise<Track[]> => {
  if (source === "favorite-folder") return getAllFavTracks({ id });

  if (source === "season") {
    const response = await getUserVideoArchivesList({ season_id: Number(id) });
    return response.code === 0 ? (response.data?.medias ?? []).map(adaptCollectionMediaToTrack) : [];
  }

  const infoResponse = await getSeriesInfo({ series_id: Number(id) });
  const meta = infoResponse.data?.meta;
  if (!meta?.mid || !meta.total) return [];

  const pageSize = 30;
  const responses = await Promise.all(
    Array.from({ length: Math.ceil(meta.total / pageSize) }, (_, index) =>
      getSeriesArchives({ mid: meta.mid, series_id: Number(id), sort: "desc", pn: index + 1, ps: pageSize }),
    ),
  );

  return responses.flatMap(response =>
    (response.data?.archives ?? []).map(archive =>
      adaptSeriesArchiveToTrack(archive, { id: String(meta.mid), name: meta.creator || "未知创作者" }),
    ),
  );
};
