import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { addToast } from "@heroui/react";
import { useShallow } from "zustand/react/shallow";

import { formatDuration, formatSecondsToDate } from "@/common/utils/time";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { AssetTrackList } from "@/features/assets/asset-track-list";
import { postHistoryClear } from "@/service/history-clear";
import { postHistoryDelete } from "@/service/history-delete";
import {
  searchWebInterfaceHistory,
  type HistoryListItem,
  type WebInterfaceHistorySearchParams,
} from "@/service/web-interface-history-search";
import { openLoginModal } from "@/store/login-modal";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";
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
  // 首页加载失败时的错误信息；为空表示无错误（避免用空态伪装请求失败）
  const [loadError, setLoadError] = useState<null | string>(null);
  const pageRef = useRef(1);
  const keywordRef = useRef("");
  const dateRangeRef = useRef<{ start?: number; end?: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const user = useUser(state => state.user);
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
      // 请求成功：清除错误态，统一走追加逻辑（首次加载 / 刷新前会清空 list）
      setLoadError(null);
      if (pageRef.current === 1) {
        setList(newList);
      } else {
        setList(prev => [...prev, ...newList]);
      }

      setHasMore(res.data.has_more);
    } catch (error: any) {
      const message = error?.message || "获取历史记录失败";
      if (pageRef.current === 1) {
        // 首页失败：进入错误态并提供重试，不用"暂无记录"的空态掩盖失败
        setList([]);
        setLoadError(message);
      } else {
        // 加载更多失败：保留已有列表，仅提示
        addToast({
          title: message,
          color: "danger",
        });
      }
    }
  }, []);

  const refreshList = useCallback(async () => {
    pageRef.current = 1;
    setLoadError(null);
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
    // 未登录时由登录门禁接管，不再发起必然失败的请求
    if (!user?.isLogin) return;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 0;
    dateRangeRef.current = days ? { start: Date.now() - days * 86_400_000, end: Date.now() } : null;
    void refreshList();
  }, [range, refreshList, user?.isLogin]);

  const handleMenuAction = useCallback(async (key: string, item: HistoryListItem) => {
    switch (key) {
      case "play":
        await usePlayList.getState().play({
          type: "mv",
          title: item.title,
          cover: item.cover,
          bvid: item.history.bvid,
          ownerName: item.author_name,
          ownerMid: item.author_mid,
        });
        break;
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
      <div className="asset4188-page">
        <header className="asset4188-head">
          <div>
            <span className="asset4188-eyebrow">来自 Bilibili</span>
            <h1>观看历史</h1>
            <p>这里显示 Bilibili 历史，不等同于 lili 的听歌统计。</p>
          </div>
          <div className="asset4188-actions">
            <button
              type="button"
              className={reportPlayHistory ? "is-primary" : ""}
              onClick={() => updateSettings({ reportPlayHistory: !reportPlayHistory })}
            >
              {reportPlayHistory ? "记录历史 · 开" : "记录历史 · 关"}
            </button>
            <button type="button" className="is-danger" disabled={!user?.isLogin} onClick={handleClear}>
              清空历史
            </button>
          </div>
        </header>
        <div className="asset4188-filter">
          <HistorySearch onSearch={handleSearch} onDateRangeChange={handleDateRangeChange} />
        </div>
        {!user?.isLogin ? (
          <PageState
            kind="empty"
            title="登录后查看观看历史"
            description="历史记录同步自当前 B 站账号，登录后即可查看与清理"
            actionLabel="去登录"
            onAction={openLoginModal}
          />
        ) : loading && list.length === 0 ? (
          <PageState kind="loading" />
        ) : loadError && list.length === 0 ? (
          <PageState kind="error" description={loadError} actionLabel="重新加载" onAction={() => void refreshList()} />
        ) : isEmpty ? (
          <PageState kind="empty" title="暂无历史记录" />
        ) : (
          <section className="asset4188-section">
            <div className="asset4188-section-head">
              <h2>观看记录 · {list.length} 条</h2>
            </div>
            <AssetTrackList
              label="观看记录"
              rows={list.map((item, index) => ({
                id: `${item.history.business}-${item.kid}`,
                index: index + 1,
                title: item.title,
                subtitle: item.author_name,
                art: item.cover,
                middle: `${formatDuration(item.progress ?? 0)} / ${formatDuration(item.duration ?? 0)}`,
                end: formatSecondsToDate(item.view_at),
                source: item,
              }))}
              actions={[
                { key: "play-next", label: "下一首", icon: "next" },
                { key: "add-to-playlist", label: "入队", icon: "queue-add" },
                { key: "download-audio", label: "下载", icon: "download" },
                { key: "delete", label: "删除", icon: "trash" },
              ]}
              onAction={(row, key) => void handleMenuAction(key, row.source)}
            />
            {hasMore && (
              <div className="mt-5 flex justify-center">
                <Button variant="neutral" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                  {loadingMore ? "加载中…" : "加载更多"}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </ScrollContainer>
  );
};

export default History;
