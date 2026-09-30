import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { addToast } from "@heroui/react";
import { useShallow } from "zustand/react/shallow";

import { formatDuration, formatSecondsToDate } from "@/common/utils/time";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { postHistoryClear } from "@/service/history-clear";
import { postHistoryDelete } from "@/service/history-delete";
import {
  searchWebInterfaceHistory,
  type HistoryListItem,
  type WebInterfaceHistorySearchParams,
} from "@/service/web-interface-history-search";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { InfoPanel } from "@/ui/patterns/info-panel";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { PageState } from "@/ui/states/page-state";

import HistorySearch from "./search";

const History = () => {
  const [searchParams] = useSearchParams();
  const range = searchParams.get("range") ?? "all";
  const scrollerRef = useRef<ScrollRefObject>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [list, setList] = useState<HistoryListItem[]>([]);
  const pageRef = useRef(1);
  const keywordRef = useRef("");
  const dateRangeRef = useRef<{ start?: number; end?: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { reportPlayHistory, updateSettings } = useSettings(
    useShallow(state => ({
      reportPlayHistory: state.reportPlayHistory,
      updateSettings: state.update,
    })),
  );

  // 加载历史记录（只负责请求和数据合并，loading 状态由调用方管理）
  const fetchHistory = useCallback(async () => {
    try {
      const params: WebInterfaceHistorySearchParams = {
        pn: pageRef.current,
        keyword: keywordRef.current,
        business: "archive",
      };

      if (dateRangeRef.current) {
        if (dateRangeRef.current.start) {
          params.add_time_start = Math.floor(dateRangeRef.current.start / 1000);
        }
        if (dateRangeRef.current.end) {
          params.add_time_end = Math.floor(dateRangeRef.current.end / 1000);
        }
      }

      const res = await searchWebInterfaceHistory(params);

      if (res.code !== 0) {
        if (res.code === -101) {
          throw new Error("请先登录");
        }
        throw new Error(res.message || "获取历史记录失败");
      }

      const newList = res.data?.list || [];
      // 统一走追加逻辑；首次加载 / 刷新前会清空 list
      if (pageRef.current === 1) {
        setList(newList);
      } else {
        setList(prev => [...prev, ...newList]);
      }

      setHasMore(res.data.has_more);
    } catch (error: any) {
      addToast({
        title: error?.message || "获取历史记录失败",
        color: "danger",
      });
      // 如果是第一页请求失败，清空列表
      if (pageRef.current === 1) {
        setList([]);
      }
    }
  }, []);

  const refreshList = useCallback(async () => {
    pageRef.current = 1;
    setLoading(true);
    try {
      await fetchHistory();
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      pageRef.current += 1;
      await fetchHistory();
    } catch {
      pageRef.current -= 1;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchHistory]);

  const handleSearch = useCallback(
    async (keyword: string) => {
      keywordRef.current = keyword;
      pageRef.current = 1;
      setLoading(true);
      try {
        await fetchHistory();
      } finally {
        setLoading(false);
      }
    },
    [fetchHistory],
  );

  const handleDateRangeChange = useCallback(
    async (range: { start?: number; end?: number } | null) => {
      dateRangeRef.current = range;
      pageRef.current = 1;
      setLoading(true);
      try {
        await fetchHistory();
      } finally {
        setLoading(false);
      }
    },
    [fetchHistory],
  );

  useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 0;
    dateRangeRef.current = days ? { start: Date.now() - days * 86_400_000, end: Date.now() } : null;
    void refreshList();
  }, [range, refreshList]);

  const handleMenuAction = useCallback(async (key: string, item: HistoryListItem) => {
    switch (key) {
      case "play-next":
        usePlayList.getState().addToNext({
          type: "mv",
          title: item.title,
          cover: item.cover,
          bvid: item.history.bvid,
          ownerName: item.author_name,
          ownerMid: item.author_mid,
        });
        break;
      case "add-to-playlist":
        usePlayList.getState().addList([
          {
            type: "mv",
            title: item.title,
            cover: item.cover,
            bvid: item.history.bvid,
            ownerName: item.author_name,
            ownerMid: item.author_mid,
          },
        ]);
        break;
      case "download-audio":
        await window.electron.addMediaDownloadTask({
          outputFileType: "audio",
          title: item.title,
          cover: item.cover,
          bvid: item.history.bvid,
          cid: item.history.cid,
        });
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      case "download-video":
        await window.electron.addMediaDownloadTask({
          outputFileType: "video",
          title: item.title,
          cover: item.cover,
          bvid: item.history.bvid,
          cid: item.history.cid,
        });
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      case "bililink":
        window.electron.openExternal(`https://www.bilibili.com/video/${item.history.bvid}`);
        break;
      case "delete":
        useModalStore.getState().onOpenConfirmModal({
          title: `删除记录${item.title}`,
          confirmText: "删除",
          onConfirm: async () => {
            const res = await postHistoryDelete({
              kid: `${item.history.business}_${item.kid}`,
            });

            if (res.code === 0) {
              setList(prev => prev.filter(record => record.kid !== item.kid));
              addToast({
                title: "已删除记录",
                color: "success",
              });
            }
            return res.code === 0;
          },
        });
        break;
    }
  }, []);

  const handleClear = useCallback(() => {
    useModalStore.getState().onOpenConfirmModal({
      title: "确认删除所有历史记录？",
      confirmText: "删除",
      onConfirm: async () => {
        const res = await postHistoryClear();
        if (res.code === 0) {
          refreshList();
        }
        return res.code === 0;
      },
    });
  }, [refreshList]);

  const isEmpty = !loading && list.length === 0;

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <PageHeader
        title="B站历史"
        lead="按时间查看、搜索和管理观看记录。"
        aside={
          <InfoPanel
            eyebrow="同步状态"
            items={[`共 ${list.length} 条已加载`, reportPlayHistory ? "播放历史上报 · 开启" : "播放历史上报 · 关闭"]}
          />
        }
      >
        <FilterBar label="历史操作">
          <Button
            variant={reportPlayHistory ? "primary" : "neutral"}
            onClick={() => updateSettings({ reportPlayHistory: !reportPlayHistory })}
          >
            {reportPlayHistory ? "记录历史 · 开" : "记录历史 · 关"}
          </Button>
          <Button variant="danger" onClick={handleClear}>
            清空历史
          </Button>
        </FilterBar>
      </PageHeader>
      <HistorySearch onSearch={handleSearch} onDateRangeChange={handleDateRangeChange} />
      {loading && list.length === 0 ? (
        <PageState kind="loading" />
      ) : isEmpty ? (
        <PageState kind="empty" title="暂无历史记录" />
      ) : (
        <Section title={`观看记录 · ${list.length} 条`}>
          <TrackTable
            columns={[
              { key: "index", label: "#" },
              { key: "title", label: "标题" },
              { key: "progress", label: "进度" },
              { key: "time", label: "观看时间", align: "end" },
            ]}
          >
            {list.map((item, index) => (
              <TrackTableRow
                key={`${item.history.business}-${item.kid}`}
                onDoubleClick={() =>
                  void usePlayList.getState().play({
                    type: "mv",
                    title: item.title,
                    cover: item.cover,
                    bvid: item.history.bvid,
                    ownerName: item.author_name,
                    ownerMid: item.author_mid,
                  })
                }
              >
                <TrackIndex value={index + 1} />
                <TrackMain>
                  <TrackArt src={item.cover} artKey={String(item.kid)} />
                  <TrackText title={item.title} subtitle={item.author_name} />
                </TrackMain>
                <TrackCell>{`${formatDuration(item.progress ?? 0)} / ${formatDuration(item.duration ?? 0)}`}</TrackCell>
                <TrackCell align="end">{formatSecondsToDate(item.view_at)}</TrackCell>
                <TrackTableActions
                  actions={[
                    {
                      key: "play-next",
                      label: "下一首",
                      icon: "next",
                      onPress: () => void handleMenuAction("play-next", item),
                    },
                    {
                      key: "queue-add",
                      label: "入队",
                      icon: "queue-add",
                      onPress: () => void handleMenuAction("add-to-playlist", item),
                    },
                    {
                      key: "download",
                      label: "下载",
                      icon: "download",
                      onPress: () => void handleMenuAction("download-audio", item),
                    },
                    {
                      key: "delete",
                      label: "删除",
                      icon: "trash",
                      onPress: () => void handleMenuAction("delete", item),
                    },
                  ]}
                />
              </TrackTableRow>
            ))}
          </TrackTable>
          {hasMore && (
            <div className="mt-5 flex justify-center">
              <Button variant="neutral" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                {loadingMore ? "加载中…" : "加载更多"}
              </Button>
            </div>
          )}
        </Section>
      )}
    </ScrollContainer>
  );
};

export default History;
