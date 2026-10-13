import { useCallback, useEffect, useRef, useState } from "react";

import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";

import { toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRankItemToTrack, dedupeTracks } from "@/adapters/track/recommendation";
import { formatNumber } from "@/common/utils/number";
import { formatDuration } from "@/common/utils/time";
import {
  DiscoverListView,
  discoverListColumns,
  type DiscoverListTrackRow,
} from "@/features/discover/discover-list-view";
import { DISCOVER_LIST_TRACK_ACTIONS } from "@/features/discover/track-actions";
import { getMusicComprehensiveWebRank } from "@/service/music-comprehensive-web-rank";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { Button } from "@/ui/primitives/button";
import { PageState } from "@/ui/states/page-state";

const PAGE_SIZE = 20;

const toListRow = (track: Track, rank: number): DiscoverListTrackRow => ({
  id: track.id,
  index: rank,
  title: track.title,
  subtitle: track.creator?.name ?? "未知创作者",
  stats: `${formatNumber(track.playCount) ?? "—"} 播放`,
  duration: typeof track.duration === "number" ? formatDuration(track.duration) : "—",
  art: track.cover,
  artKey: track.id,
});

/**
 * 音乐榜单（单一综合榜）。
 *
 * 数据收紧说明（2026-10-13 审计结论）：
 * - `music-comprehensive-web-rank` 是单一综合榜接口，无榜单分类参数，
 *   因此**不做**多榜单 tab 切换；
 * - 接口无榜单更新时间 / 统计周期字段，**不写**「每周更新」类文案；
 * - 接口无历史排名，**不画**排名升降箭头；
 * - 排名 = score 排序后的序号，分页用 pn/ps。
 */
const ChartLive = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("请稍后重试");
  const requestSeq = useRef(0);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    const seq = ++requestSeq.current;
    if (append) setLoadingMore(true);
    else setStatus("loading");
    setErrorMessage("请稍后重试");
    try {
      const res = await getMusicComprehensiveWebRank({ pn: nextPage, ps: PAGE_SIZE });
      if (seq !== requestSeq.current) return;
      if (res.code !== 0) throw new Error(res.message || `B站接口返回 ${res.code}`);
      const list = res.data?.list ?? [];
      const adapted = list.map((item, i) => adaptRankItemToTrack(item, `chart-${nextPage}-${i}`));
      if (append) {
        setTracks(prev => dedupeTracks([...prev, ...adapted]));
      } else {
        setTracks(adapted);
      }
      setPage(nextPage);
      setHasMore(list.length >= PAGE_SIZE);
      setStatus("ready");
    } catch (error) {
      if (seq !== requestSeq.current) return;
      if (!append) {
        setTracks([]);
        setErrorMessage(error instanceof Error ? error.message : "无法加载榜单");
        setStatus("error");
      } else {
        addToast({ title: "加载更多失败，请重试", color: "danger" });
      }
    } finally {
      if (seq === requestSeq.current) setLoadingMore(false);
    }
  }, []);

  useEffect(() => void load(1, false), [load]);

  const act = useCallback(async (track: Track, key: string) => {
    if (key === "play") return usePlayList.getState().play(toPlayItem(track));
    if (key === "play-next") return usePlayList.getState().addToNext(toPlayItem(track));
    if (key === "queue-add") return usePlayList.getState().addList([toPlayItem(track)]);
    if (key === "favorite") {
      const selection = toFavoriteSelection(track);
      if (selection) useModalStore.getState().onOpenFavSelectModal(selection);
      return;
    }
    if (key === "download-audio") {
      const task = toMediaDownloadInfo(track, "audio");
      if (task) await window.electron.addMediaDownloadTask(task);
      addToast({ title: "已添加下载任务", color: "success" });
    }
  }, []);

  const content = (() => {
    if (status === "loading") return <PageState kind="loading" className="min-h-[420px]" />;
    if (status === "error")
      return (
        <PageState
          kind="error"
          description={errorMessage}
          actionLabel="重新加载"
          onAction={() => void load(1, false)}
        />
      );
    if (!tracks.length) return <PageState kind="empty" />;
    return undefined;
  })();

  const rows = tracks.map((track, i) => toListRow(track, i + 1));

  return (
    <DiscoverListView
      title="音乐榜单"
      lead="B 站音乐综合榜单。"
      filters={[]}
      content={
        <>
          {content}
          {status === "ready" && hasMore && !content && (
            <div className="mt-5 flex justify-center">
              <Button variant="neutral" disabled={loadingMore} onClick={() => void load(page + 1, true)}>
                {loadingMore ? "加载中…" : "加载更多"}
              </Button>
            </div>
          )}
        </>
      }
      sectionTitle="综合榜"
      columns={discoverListColumns(["#", "标题", "播放", "时长"])}
      tracks={rows}
      rowActions={DISCOVER_LIST_TRACK_ACTIONS}
      demoActionRowIds={[]}
      onPillPress={() => {}}
      onRowAction={(row, key) => {
        const track = tracks.find(item => item.id === row.id);
        if (track) void act(track, key);
      }}
    />
  );
};

const Chart = () => <ChartLive />;

export default Chart;
