import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import { useRequest } from "ahooks";

import { CollectionType } from "@/common/constants/collection";
import { type ScrollRefObject } from "@/components/scroll-container";
import { executePlaylistBulkAction } from "@/features/playlist/bulk-actions";
import { PlaylistDetail } from "@/features/playlist/playlist-detail";
import { PlaylistTrackView } from "@/features/playlist/playlist-track-view";
import { adaptCollectionMediaToTrack } from "@/features/playlist/tracks";
import { executeTrackAction, type TrackActionKey } from "@/features/track/actions";
import { postFavSeasonFav } from "@/service/fav-season-fav";
import { postFavSeasonUnfav } from "@/service/fav-season-unfav";
import { getUserVideoArchivesList } from "@/service/user-video-archives-list";
import { useFavoritesStore } from "@/store/favorite";
import { useUser } from "@/store/user";

import Header from "../header";
import Operations from "../operation";
import { getContextMenus } from "./menu";

/** 视频合集 */
const VideoCollections = () => {
  const { id } = useParams();
  const user = useUser(state => state.user);
  const collectedFavorites = useFavoritesStore(state => state.collectedFavorites);
  const addCollectedFavorite = useFavoritesStore(state => state.addCollectedFavorite);
  const rmCollectedFavorite = useFavoritesStore(state => state.rmCollectedFavorite);
  const isFavorite = collectedFavorites?.some(item => item.id === Number(id));

  const [keyword, setKeyword] = useState<string>();
  const [order, setOrder] = useState("pubtime");

  const scrollRef = useRef<ScrollRefObject>(null);

  const { data, loading } = useRequest(
    async () => {
      if (!id) {
        return;
      }

      const res = await getUserVideoArchivesList({
        season_id: Number(id),
      });
      return res?.data;
    },
    {
      refreshDeps: [id],
    },
  );

  useEffect(() => {
    if (id) {
      setKeyword("");
      setOrder("pubtime");
    }
  }, [id]);

  // 过滤和排序媒体数据
  const filteredMedias = useMemo(() => {
    const medias = data?.medias ?? [];

    // 根据搜索关键词过滤title
    let result = medias;
    if (keyword) {
      result = medias.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
    }

    // 根据排序条件排序
    switch (order) {
      case "play":
        result = [...result].sort((a, b) => (b.cnt_info?.play || 0) - (a.cnt_info?.play || 0));
        break;
      case "collect":
        result = [...result].sort((a, b) => (b.cnt_info?.collect || 0) - (a.cnt_info?.collect || 0));
        break;
      case "pubtime":
        result = [...result].sort((a, b) => (b.pubtime || 0) - (a.pubtime || 0));
        break;
      default:
        break;
    }

    return result;
  }, [data?.medias, keyword, order]);

  const onPlayAll = () => {
    void executePlaylistBulkAction("play-all", filteredMedias.map(adaptCollectionMediaToTrack));
  };

  const addToPlayList = () => {
    void executePlaylistBulkAction("add-all", filteredMedias.map(adaptCollectionMediaToTrack));
  };

  const toggleFavorite = async () => {
    if (isFavorite) {
      // 取消收藏
      const res = await postFavSeasonUnfav({
        season_id: Number(id),
        platform: "web",
      });

      if (res.code === 0) {
        rmCollectedFavorite(Number(id));
      }
    } else {
      // 收藏
      const res = await postFavSeasonFav({
        season_id: Number(id),
        platform: "web",
      });

      if (res.code === 0) {
        addCollectedFavorite({
          id: Number(id),
          title: data?.info?.title || "未命名合集",
          cover: data?.info?.cover,
          type: CollectionType.VideoCollections,
          mid: data?.info?.upper?.mid,
        });
      }
    }
  };

  const isCreatedBySelf = data?.info?.upper?.mid === user?.mid;

  const getScrollElement = useCallback(() => {
    return scrollRef.current?.osInstance()?.elements().viewport as HTMLElement | null;
  }, []);
  const trackEntries = filteredMedias.map(item => ({
    id: `bilibili-video:${item.bvid}`,
    track: adaptCollectionMediaToTrack(item),
    source: item,
    timestamp: item.pubtime,
  }));

  return (
    <PlaylistDetail
      scrollRef={scrollRef}
      resetKey={id}
      header={
        <Header
          type={CollectionType.VideoCollections}
          cover={data?.info?.cover}
          title={data?.info?.title}
          desc={data?.info?.intro}
          upMid={data?.info?.upper?.mid}
          mediaCount={data?.info?.media_count}
        />
      }
      actions={
        <Operations
          loading={loading}
          type={CollectionType.VideoCollections}
          order={order}
          onKeywordSearch={setKeyword}
          onOrderChange={setOrder}
          orderOptions={[
            { key: "pubtime", label: "最近投稿" },
            { key: "play", label: "最多播放" },
            { key: "collect", label: "最多收藏" },
          ]}
          mediaCount={data?.info?.media_count}
          isFavorite={isFavorite}
          isCreatedBySelf={isCreatedBySelf}
          onToggleFavorite={toggleFavorite}
          onPlayAll={onPlayAll}
          onAddToPlayList={addToPlayList}
        />
      }
    >
      <PlaylistTrackView
        entries={trackEntries}
        loading={loading}
        getScrollElement={getScrollElement}
        getActions={getContextMenus}
        onAction={(key, entry) =>
          void executeTrackAction(key === "bililink" ? "open-source" : (key as TrackActionKey), entry.track)
        }
        onPlay={entry => void executeTrackAction("play", entry.track)}
      />
    </PlaylistDetail>
  );
};

export default VideoCollections;
