import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import type { ScrollRefObject } from "@/components/scroll-container";
import type { TrackActionKey } from "@/features/track/actions";
import type { ToViewVideoItem } from "@/service/history-toview-list";

import { useLaterFixtureData } from "@/features/later/fixture";
import { laterColumns, LaterView, type LaterViewPill } from "@/features/later/later-view";
import { adaptWatchLaterEntry, type WatchLaterEntry } from "@/features/later/model";
import { executePlaylistBulkAction } from "@/features/playlist/bulk-actions";
import { PLAYLIST_DETAIL_TRACK_ACTIONS } from "@/features/playlist/track-actions";
import { executeTrackAction } from "@/features/track/actions";
import { postHistoryToViewDel } from "@/service/history-toview-del";
import { getHistoryToViewList, type HistoryToViewListParams } from "@/service/history-toview-list";
import { useModalStore } from "@/store/modal";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { PageState } from "@/ui/states/page-state";

const PAGE_SIZE = 20;

const RANGE_DAYS: Readonly<Record<string, number | undefined>> = {
  all: undefined,
  "7d": 7,
  "30d": 30,
};

const Later = () => {
  const fixture = useLaterFixtureData();
  const [searchParams] = useSearchParams();
  const scrollerRef = useRef<ScrollRefObject>(null);
  const [items, setItems] = useState<ToViewVideoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const pageRef = useRef(1);

  const range = searchParams.get("range") ?? "all";
  const keyword = searchParams.get("key") ?? "";
  const rangeDays = RANGE_DAYS[range];

  const fetchPage = useCallback(
    async (page: number) => {
      const params: HistoryToViewListParams = { pn: page, ps: PAGE_SIZE, key: keyword };
      if (rangeDays) {
        const now = Date.now();
        params.add_time_start = Math.floor((now - rangeDays * 24 * 60 * 60 * 1000) / 1000);
        params.add_time_end = Math.floor(now / 1000);
      }

      const response = await getHistoryToViewList(params);
      if (response?.code !== 0 || !response.data) throw new Error(response?.message || "稍后播放加载失败");
      setTotal(response.data.count ?? 0);
      setItems(previous => (page === 1 ? (response.data.list ?? []) : [...previous, ...(response.data.list ?? [])]));
    },
    [keyword, rangeDays],
  );

  const refresh = useCallback(async () => {
    if (fixture) return;
    setInitialLoading(true);
    setLoadError(false);
    pageRef.current = 1;
    try {
      await fetchPage(1);
    } catch {
      setItems([]);
      setTotal(0);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [fetchPage, fixture]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (fixture || loadingMore || initialLoading || items.length >= total) return;
    setLoadingMore(true);
    pageRef.current += 1;
    try {
      await fetchPage(pageRef.current);
    } catch {
      pageRef.current -= 1;
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, fixture, initialLoading, items.length, loadingMore, total]);

  const entries = useMemo(() => items.map(adaptWatchLaterEntry), [items]);
  const viewedCount = items.filter(item => item.duration > 0 && item.progress >= item.duration).length;

  const clearViewed = useCallback(() => {
    useModalStore.getState().onOpenConfirmModal({
      title: "删除已观看完的视频？",
      confirmText: "删除",
      onConfirm: async () => {
        const response = await postHistoryToViewDel({ viewed: true });
        if (response.code === 0) await refresh();
        return response.code === 0;
      },
    });
  }, [refresh]);

  const handlePillPress = useCallback(
    (pill: LaterViewPill, source: WatchLaterEntry[]) => {
      if (pill.label === "清除已看完") {
        clearViewed();
        return;
      }
      const tracks = source.map(entry => entry.track);
      if (pill.label === "播放全部") void executePlaylistBulkAction("play-all", tracks);
      if (pill.label === "随机播放") {
        void executePlaylistBulkAction(
          "play-all",
          [...tracks].sort(() => Math.random() - 0.5),
        );
      }
    },
    [clearViewed],
  );

  const handleRowAction = useCallback((entry: WatchLaterEntry, actionKey: string) => {
    const key = actionKey === "queue-add" ? "add-to-playlist" : actionKey;
    void executeTrackAction(key as TrackActionKey, entry.track);
  }, []);

  if (fixture) {
    return (
      <>
        <LaterView
          title={fixture.title}
          lead={fixture.lead}
          panelEyebrow={fixture.panelEyebrow}
          panelItems={fixture.panelItems}
          pills={fixture.pills}
          sectionTitle={fixture.sectionTitle}
          columns={laterColumns(fixture.head)}
          tracks={fixture.tracks.map(row => ({
            ...row,
            progressPercent: row.progress.endsWith("%") ? Number.parseInt(row.progress, 10) : undefined,
          }))}
          rowActions={PLAYLIST_DETAIL_TRACK_ACTIONS}
          demoActionRowIds={fixture.demoActionRowIds}
          onPillPress={() => undefined}
          onRowAction={() => undefined}
        />
        <AnnotationBand>{fixture.note}</AnnotationBand>
      </>
    );
  }

  if (initialLoading) return <PageState kind="loading" className="min-h-[420px]" />;
  if (loadError) return <PageState kind="error" actionLabel="重新加载" onAction={() => void refresh()} />;
  if (!entries.length) {
    return (
      <PageState
        kind="empty"
        title={keyword ? "没有匹配的稍后播放内容" : "暂无稍后播放内容"}
        description="内容同步自当前 B 站账号的稍后再看列表"
      />
    );
  }

  const pills: LaterViewPill[] = [
    { kind: "primary", label: "播放全部" },
    { kind: "secondary", label: "随机播放" },
    { kind: "danger", label: "清除已看完" },
    { kind: "neutral", label: "同步自 B 站稍后再看" },
    {
      kind: "accent",
      label: `日期范围 · ${range === "7d" ? "近 7 天" : range === "30d" ? "近 30 天" : "全部"}`,
    },
  ];

  return (
    <LaterView
      title="稍后播放"
      lead="内容同步自 B 站稍后再看列表，支持标题 / UP 主搜索与日期范围筛选。"
      panelEyebrow="与 B 站稍后再看同步"
      panelItems={[`本次已同步 · ${items.length} 条`, `${total} 条 · 已看 ${viewedCount} 条`]}
      pills={pills}
      sectionTitle={`稍后再看 · 共 ${total} 条`}
      columns={laterColumns(["#", "标题", "UP 主 · 加入时间", "进度"])}
      tracks={entries}
      rowActions={PLAYLIST_DETAIL_TRACK_ACTIONS}
      demoActionRowIds={[]}
      onPillPress={pill => handlePillPress(pill, entries)}
      onRowAction={(row, key) => {
        const entry = entries.find(candidate => candidate.id === row.id);
        if (entry) handleRowAction(entry, key);
      }}
      scrollRef={scrollerRef}
      onReachEnd={() => void loadMore()}
    />
  );
};

export default Later;
