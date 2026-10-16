import { useCallback, useEffect, useRef, useState } from "react";

import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";
import type { TrackActionSpec } from "@/ui/patterns/track-table";

import { toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRankItemToTrack, dedupeTracks } from "@/adapters/track/recommendation";
import { formatNumber } from "@/common/utils/number";
import { formatDuration } from "@/common/utils/time";
import ScrollContainer from "@/components/scroll-container";
import { AssetTrackList, type AssetTrackRow } from "@/features/assets/asset-track-list";
import { getMusicComprehensiveWebRank } from "@/service/music-comprehensive-web-rank";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { Button } from "@/ui/primitives/button";
import { PageState } from "@/ui/states/page-state";

import "./chart-4188.css";

const PAGE_SIZE = 20;

/**
 * 行内操作带（AssetTrackList 自带「播放」按钮，这里只给其余动作）。
 *
 * 与「发现音乐 · 列表」屏同源的五枚动作：播放 / 下一首 / 入队 / 收藏 / 下载音频。
 * 榜单条目本质是可播放的 B 站稿件（related_archive），「下载视频 / 在 B 站打开」属
 * 「更多」动作，不在行内带上常驻 —— 与同数据源的发现音乐页口径一致。
 */
const ROW_ACTIONS: readonly TrackActionSpec[] = [
  { key: "play-next", label: "下一首播放", icon: "next" },
  { key: "queue-add", label: "入队", icon: "queue-add" },
  { key: "favorite", label: "收藏", icon: "heart" },
  { key: "download-audio", label: "下载音频", icon: "download" },
];

/** 行视图模型：`AssetTrackRow` 追加领域 Track，行操作需要原对象。 */
interface ChartRow extends AssetTrackRow {
  track: Track;
}

/**
 * 音乐榜单（单一综合榜）。
 *
 * 数据收紧说明（2026-10-13 审计结论）：
 * - `music-comprehensive-web-rank` 是单一综合榜接口，无榜单分类参数，
 *   因此**不做**多榜单 tab 切换；
 * - 接口无榜单更新时间 / 统计周期字段，**不写**「每周更新」类文案；
 * - 接口无历史排名，**不画**排名升降箭头；
 * - 排名 = score 排序后的序号，分页用 pn/ps。
 *
 * 展示口径取「歌」（歌名 / 歌手 / 专辑 / 方形封面），`related_archive` 只作播放载体。
 */
const Chart = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("请稍后重试");
  const requestSeq = useRef(0);

  // 当前播放稿件的 bvid，用于榜单行的「播放中」标记。
  const currentBvid = usePlayList(state => state.list.find(item => item.id === state.playId)?.bvid);

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

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    void load(page + 1, true);
  }, [loadingMore, hasMore, page, load]);

  /** 播放全部：整表替换队列并从头开始播放（与本地音乐 / 收藏页同一语义）。 */
  const playAll = useCallback(() => {
    if (tracks.length === 0) return;
    void usePlayList.getState().playList(tracks.map(toPlayItem));
  }, [tracks]);

  const handleRowAction = useCallback(async (row: ChartRow, key: string) => {
    const track = row.track;
    switch (key) {
      case "play":
        await usePlayList.getState().play(toPlayItem(track));
        break;
      case "play-next":
        usePlayList.getState().addToNext(toPlayItem(track));
        addToast({ title: "已添加到下一首播放", color: "success" });
        break;
      case "queue-add":
        usePlayList.getState().addList([toPlayItem(track)]);
        addToast({ title: "已添加到播放列表", color: "success" });
        break;
      case "favorite": {
        const selection = toFavoriteSelection(track);
        if (selection) useModalStore.getState().onOpenFavSelectModal(selection);
        break;
      }
      case "download-audio": {
        const task = toMediaDownloadInfo(track, "audio");
        if (!task) return;
        await window.electron.addMediaDownloadTask(task);
        addToast({ title: "已添加下载任务", color: "success" });
        break;
      }
    }
  }, []);

  const rows: ChartRow[] = tracks.map((track, index) => ({
    id: track.id,
    index: index + 1,
    title: track.title,
    subtitle: [track.creator?.name, track.album].filter(Boolean).join(" · ") || "未知创作者",
    art: track.cover,
    middle: track.playCount != null && track.playCount > 0 ? formatNumber(track.playCount) : "—",
    end: typeof track.duration === "number" ? formatDuration(track.duration) : "—",
    current: Boolean(currentBvid && track.sourceRef.bvid && currentBvid === track.sourceRef.bvid),
    track,
  }));

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <div className="chart4188-page">
        {/* 紧凑页头：眉题 + 标题，右侧「播放全部」。不再有 56px 大标题 + 导语。 */}
        <header className="asset4188-head">
          <div>
            <span className="asset4188-eyebrow">B站音乐</span>
            <h1>音乐榜单</h1>
          </div>
          <div className="asset4188-actions">
            <button
              type="button"
              className="is-primary"
              disabled={status !== "ready" || tracks.length === 0}
              onClick={playAll}
            >
              播放全部
            </button>
          </div>
        </header>

        {status === "loading" ? (
          <PageState kind="loading" />
        ) : status === "error" ? (
          <PageState
            kind="error"
            description={errorMessage}
            actionLabel="重新加载"
            onAction={() => void load(1, false)}
          />
        ) : tracks.length === 0 ? (
          <PageState kind="empty" />
        ) : (
          <section className="asset4188-section">
            <div className="asset4188-section-head">
              <h2>综合榜 · {tracks.length} 首</h2>
            </div>
            <AssetTrackList label="音乐榜单" rows={rows} actions={ROW_ACTIONS} onAction={handleRowAction} />
            {hasMore && (
              <div className="mt-5 flex justify-center">
                <Button variant="neutral" disabled={loadingMore} onClick={loadMore}>
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

export default Chart;
