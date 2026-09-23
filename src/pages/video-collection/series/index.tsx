import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import { useRequest } from "ahooks";

import type { Media } from "@/service/user-video-archives-list";

import { CollectionType } from "@/common/constants/collection";
import { type ScrollRefObject } from "@/components/scroll-container";
import { executePlaylistBulkAction } from "@/features/playlist/bulk-actions";
import { PlaylistDetail } from "@/features/playlist/playlist-detail";
import { PlaylistTrackView } from "@/features/playlist/playlist-track-view";
import { adaptCollectionMediaToTrack } from "@/features/playlist/tracks";
import { executeTrackAction, type TrackActionKey } from "@/features/track/actions";
import { getSeriesArchives } from "@/service/series-archives";
import { getSeriesInfo } from "@/service/series-info";
import { useUser } from "@/store/user";

import { getContextMenus } from "../collections/menu";
import Header from "../header";
import Operations from "../operation";

const Series = () => {
  const { id } = useParams();
  const user = useUser(state => state.user);

  const [keyword, setKeyword] = useState<string>();
  const [order, setOrder] = useState("pubtime");

  const scrollRef = useRef<ScrollRefObject>(null);

  const { data: meta, loading: infoLoading } = useRequest(
    async () => {
      if (!id) return;
      const res = await getSeriesInfo({ series_id: Number(id) });
      return res?.data?.meta;
    },
    {
      ready: Boolean(id),
      refreshDeps: [id],
    },
  );

  const isCreatedBySelf = Boolean(meta?.mid) && Boolean(user?.mid) && meta?.mid === user?.mid;

  const [medias, setMedias] = useState<Media[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setMedias([]);
    setPageNum(1);
    setTotalCount(0);
    setKeyword("");
    setOrder("pubtime");
  }, [id]);

  const fetchArchives = useCallback(async () => {
    if (!id || !meta || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await getSeriesArchives({
        mid: Number(meta.mid),
        series_id: Number(id),
        sort: "desc",
        pn: pageNum,
        ps: 30,
      });
      const archives = res?.data?.archives ?? [];
      const mapped: Media[] = archives.map(a => ({
        id: a.aid,
        title: a.title,
        cover: a.pic,
        duration: a.duration,
        pubtime: a.pubdate,
        bvid: a.bvid,
        upper: { mid: Number(meta.mid), name: "" },
        cnt_info: { collect: 0, play: a.stat?.view ?? 0, danmaku: 0, vt: a.stat?.vt ?? 0 },
        enable_vt: Number(a.enable_vt ?? 0),
        vt_display: a.vt_display,
        is_self_view: false,
      }));
      setMedias(prev => [...prev].concat(mapped));
      const total = res?.data?.page?.total ?? 0;
      setTotalCount(prev => (prev > 0 ? prev : total));
      setPageNum(prev => prev + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [id, meta, loadingMore, pageNum]);

  useEffect(() => {
    if (meta?.total) {
      fetchArchives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  const filteredMedias = useMemo(() => {
    let result = medias;
    if (keyword) {
      result = result.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
    }
    switch (order) {
      case "play":
        result = [...result].sort((a, b) => (b.cnt_info?.play || 0) - (a.cnt_info?.play || 0));
        break;
      case "pubtime":
        result = [...result].sort((a, b) => (b.pubtime || 0) - (a.pubtime || 0));
        break;
      default:
        break;
    }
    return result;
  }, [medias, keyword, order]);

  const onPlayAll = () => {
    void executePlaylistBulkAction("play-all", filteredMedias.map(adaptCollectionMediaToTrack));
  };

  const addToPlayList = () => {
    void executePlaylistBulkAction("add-all", filteredMedias.map(adaptCollectionMediaToTrack));
  };

  const getScrollElement = useCallback(() => {
    return scrollRef.current?.osInstance()?.elements().viewport as HTMLElement | null;
  }, []);

  const hasMore = useMemo(() => {
    const total = totalCount || meta?.total || 0;
    return medias.length < total;
  }, [medias.length, totalCount, meta?.total]);

  const initialLoading = infoLoading || (medias.length === 0 && loadingMore);
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
          type={CollectionType.VideoSeries}
          cover={medias?.[0]?.cover}
          title={meta?.name}
          desc={meta?.description}
          upMid={meta?.mid}
          mediaCount={meta?.total}
        />
      }
      actions={
        <Operations
          loading={initialLoading}
          type={CollectionType.VideoSeries}
          order={order}
          onKeywordSearch={setKeyword}
          onOrderChange={setOrder}
          orderOptions={[
            { key: "pubtime", label: "最近投稿" },
            { key: "play", label: "最多播放" },
          ]}
          mediaCount={meta?.total}
          isCreatedBySelf={isCreatedBySelf}
          onPlayAll={onPlayAll}
          onAddToPlayList={addToPlayList}
        />
      }
    >
      <PlaylistTrackView
        entries={trackEntries}
        loading={initialLoading || loadingMore}
        getScrollElement={getScrollElement}
        getActions={getContextMenus}
        onAction={(key, entry) =>
          void executeTrackAction(key === "bililink" ? "open-source" : (key as TrackActionKey), entry.track)
        }
        onPlay={entry => void executeTrackAction("play", entry.track)}
        hasMore={hasMore}
        onLoadMore={fetchArchives}
      />
    </PlaylistDetail>
  );
};

export default Series;
