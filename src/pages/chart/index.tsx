import { useCallback, useEffect, useRef, useState } from "react";

import { addToast } from "@heroui/react";
import {
  RiExternalLinkLine,
  RiFileMusicLine,
  RiFileVideoLine,
  RiPlayCircleLine,
  RiPlayListAddLine,
  RiStarLine,
} from "@remixicon/react";

import type { Track } from "@/domain/track";

import { getTrackSourceUrl, toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRankItemToTrack, dedupeTracks } from "@/adapters/track/recommendation";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import VirtualPageList from "@/components/virtual-page-list";
import { getMusicComprehensiveWebRank } from "@/service/music-comprehensive-web-rank";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { PageHeader } from "@/ui/patterns/page-header";
import { TrackRow } from "@/ui/patterns/track-row";
import { PageState } from "@/ui/states/page-state";

import "./chart-4188.css";

const PAGE_SIZE = 20;

const CONTEXT_MENUS = [
  { icon: <RiPlayCircleLine size={18} />, key: "play-next", label: "下一首播放" },
  { icon: <RiPlayListAddLine size={18} />, key: "add-to-playlist", label: "添加到播放列表" },
  { icon: <RiStarLine size={18} />, key: "favorite", label: "收藏" },
  { icon: <RiFileMusicLine size={18} />, key: "download-audio", label: "下载音频" },
  { icon: <RiFileVideoLine size={18} />, key: "download-video", label: "下载视频" },
  { icon: <RiExternalLinkLine size={18} />, key: "bililink", label: "在 B 站打开" },
];

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
const Chart = () => {
  const scrollerRef = useRef<ScrollRefObject>(null);
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

  const handleMenuAction = useCallback(async (key: string, item: Track) => {
    switch (key) {
      case "play-next":
        usePlayList.getState().addToNext(toPlayItem(item));
        addToast({ title: "已添加到下一首播放", color: "success" });
        break;
      case "add-to-playlist":
        usePlayList.getState().addList([toPlayItem(item)]);
        addToast({ title: "已添加到播放列表", color: "success" });
        break;
      case "favorite": {
        const selection = toFavoriteSelection(item);
        if (selection) useModalStore.getState().onOpenFavSelectModal(selection);
        break;
      }
      case "download-audio":
      case "download-video": {
        const task = toMediaDownloadInfo(item, key === "download-audio" ? "audio" : "video");
        if (!task) return;
        await window.electron.addMediaDownloadTask(task);
        addToast({ title: "已添加下载任务", color: "success" });
        break;
      }
      case "bililink": {
        const url = getTrackSourceUrl(item);
        if (url) window.electron.openExternal(url);
        break;
      }
    }
  }, []);

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <div className="w-full pr-[14px]">
        <PageHeader title="音乐榜单" lead="B 站音乐综合榜单。" />
        {status === "loading" ? (
          <PageState kind="loading" className="min-h-[420px]" />
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
          <div className="chart4188-list">
            <VirtualPageList
            items={tracks}
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={() => void load(page + 1, true)}
            getScrollElement={() => scrollerRef.current?.osInstance()?.elements().viewport || null}
            rowHeight={64}
            renderItem={(item, index) => (
              <TrackRow
                key={item.id}
                index={index + 1}
                track={item}
                onPlay={() => void usePlayList.getState().play(toPlayItem(item))}
                actions={CONTEXT_MENUS}
                onAction={key => void handleMenuAction(key, item)}
              />
            )}
          />
          </div>
        )}
      </div>
    </ScrollContainer>
  );
};

export default Chart;
