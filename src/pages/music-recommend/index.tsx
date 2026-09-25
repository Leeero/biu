import React, { useCallback, useEffect, useRef, useState } from "react";

import { addToast, Tab, Tabs } from "@heroui/react";
import { RiPlayFill } from "@remixicon/react";

import type { Track } from "@/domain/track";

import { getTrackSourceUrl, toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRankItemToTrack, adaptRegionArchiveToTrack } from "@/adapters/track/recommendation";
import AsyncButton from "@/components/async-button";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { getMusicComprehensiveWebRank, type Data as MusicItem } from "@/service/music-comprehensive-web-rank";
import { getRegionFeedRcmd, type Archive } from "@/service/web-interface-region-feed-rcmd";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { PageHeader } from "@/ui/patterns/page-header";
import { PageState } from "@/ui/states/page-state";

import MusicRecommendGridList from "./grid-list";
import MusicRecommendList from "./list";
import NewMusicTop from "./new-music-top";

const PAGE_SIZE = 20;
const REGION_PAGE_SIZE = 15;
const REGION_WEB_LOCATION = "333.40138";

type RecommendTabKey = "music" | "guichu" | "pop";

const REGION_MAP: Record<Exclude<RecommendTabKey, "pop">, number> = {
  music: 1003,
  guichu: 1007,
};

const MusicRecommend = () => {
  const scrollerRef = useRef<ScrollRefObject>(null);

  const [list, setList] = useState<Track[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const pageRef = useRef(1);
  const [activeTab, setActiveTab] = useState<RecommendTabKey>("music");
  const scrollRestoreRef = useRef<{ tab: RecommendTabKey; top: number } | null>(null);
  const [popLayoutVersion, setPopLayoutVersion] = useState(0);

  const displayMode = useSettings(state => state.displayMode);
  const listKey = `${activeTab}-${displayMode}-${activeTab === "pop" ? popLayoutVersion : 0}`;

  const getScrollElement = useCallback(() => {
    return (scrollerRef.current?.osInstance()?.elements().viewport as HTMLElement | null) ?? null;
  }, []);

  const handlePopLayoutChange = useCallback(() => {
    setPopLayoutVersion(prev => prev + 1);
  }, []);

  const fetchPage = useCallback(
    async (pn: number = 1) => {
      if (activeTab === "pop") {
        const res = await getMusicComprehensiveWebRank({ pn, ps: PAGE_SIZE, web_location: "333.1351" });
        const items = res?.data?.list ?? [];
        if (res.code === 0) {
          const normalized = items.map((item: MusicItem, index: number) =>
            adaptRankItemToTrack(item, `${pn}-${index}`),
          );
          setList(prev => (pn === 1 ? normalized : [...prev, ...normalized]));
          setHasMore(items.length === PAGE_SIZE);
        } else {
          if (pn === 1) {
            setList([]);
          }
          setHasMore(false);
        }
        return;
      }

      const res = await getRegionFeedRcmd({
        display_id: pn,
        request_cnt: REGION_PAGE_SIZE,
        from_region: REGION_MAP[activeTab],
        device: "web",
        plat: 30,
        web_location: REGION_WEB_LOCATION,
      });
      const items = res?.data?.archives ?? [];
      if (res.code === 0) {
        const normalized = items.map((item: Archive, index: number) =>
          adaptRegionArchiveToTrack(item, `${pn}-${index}`),
        );
        setList(prev => (pn === 1 ? normalized : [...prev, ...normalized]));
        setHasMore(items.length === REGION_PAGE_SIZE);
      } else {
        if (pn === 1) {
          setList([]);
        }
        setHasMore(false);
      }
    },
    [activeTab],
  );

  const loadMore = async () => {
    if (initialLoading || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      pageRef.current += 1;
      await fetchPage(pageRef.current);
    } finally {
      setLoadingMore(false);
    }
  };

  const init = useCallback(async () => {
    try {
      setLoadError(false);
      pageRef.current = 1;
      setHasMore(true);
      setLoadingMore(false);
      await fetchPage(1);
    } catch {
      setList([]);
      setHasMore(false);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    setInitialLoading(true);
    init();
  }, [activeTab, init]);

  useEffect(() => {
    if (initialLoading) return;
    const restore = scrollRestoreRef.current;
    if (!restore || restore.tab !== activeTab) return;
    const viewport = getScrollElement();
    if (!viewport) return;
    const top = restore.top;
    requestAnimationFrame(() => {
      viewport.scrollTop = top;
      scrollRestoreRef.current = null;
    });
  }, [activeTab, getScrollElement, initialLoading, list.length]);

  const handlePlayAll = useCallback(async () => {
    const items = list.filter(item => item.sourceRef.bvid).map(toPlayItem);

    if (!items.length) {
      addToast({ title: "暂无可播放内容", color: "warning" });
      return;
    }

    await usePlayList.getState().addList(items);
    addToast({ title: `已添加 ${items.length} 首到播放列表`, color: "success" });
  }, [list]);

  const handleMenuAction = useCallback(async (key: string, item: Track) => {
    if (!item.sourceRef.bvid && key !== "favorite") {
      addToast({ title: "暂无可播放内容", color: "warning" });
      return;
    }
    switch (key) {
      case "favorite": {
        const selection = toFavoriteSelection(item);
        if (!selection) {
          addToast({ title: "该项目无法收藏", color: "warning" });
          return;
        }
        useModalStore.getState().onOpenFavSelectModal(selection);
        break;
      }
      case "play-next":
        usePlayList.getState().addToNext(toPlayItem(item));
        break;
      case "add-to-playlist":
        usePlayList.getState().addList([toPlayItem(item)]);
        break;
      case "download-audio": {
        const task = toMediaDownloadInfo(item, "audio");
        if (!task) return;
        await window.electron.addMediaDownloadTask(task);
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      }
      case "download-video": {
        const task = toMediaDownloadInfo(item, "video");
        if (!task) return;
        await window.electron.addMediaDownloadTask(task);
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      }
      case "bililink": {
        const url = getTrackSourceUrl(item);
        if (url) window.electron.openExternal(url);
        break;
      }
      default:
        break;
    }
  }, []);

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <div className="w-full pt-5 pb-8">
        <PageHeader
          title="发现音乐"
          description="浏览来自 B 站音乐分区的推荐内容与新歌，不包含个性化推荐。"
          className="mb-4"
          actions={
            <AsyncButton
              color="primary"
              size="md"
              radius="full"
              startContent={<RiPlayFill size={18} />}
              isDisabled={initialLoading || list.length === 0}
              onPress={handlePlayAll}
            >
              全部播放
            </AsyncButton>
          }
        />
        <div className="mb-6 flex items-center border-b border-[rgb(var(--biu-color-border)/0.06)] pb-3">
          <Tabs
            aria-label="发现音乐分类"
            variant="light"
            size="md"
            radius="full"
            classNames={{
              tabList: "gap-1 bg-[rgb(var(--biu-color-surface-hover))] p-1 rounded-full",
              cursor: "rounded-full bg-[rgb(var(--biu-color-surface-raised))] shadow-sm",
              tabContent: "group-data-[selected=true]:text-primary font-medium",
            }}
            selectedKey={activeTab}
            onSelectionChange={key => {
              const nextTab = key as RecommendTabKey;
              const viewport = getScrollElement();
              if (viewport) scrollRestoreRef.current = { tab: nextTab, top: viewport.scrollTop };
              setActiveTab(nextTab);
            }}
          >
            <Tab key="music" title="音乐" />
            <Tab key="pop" title="流行" />
            <Tab key="guichu" title="鬼畜" />
          </Tabs>
        </div>
        {activeTab === "pop" && <NewMusicTop onLayoutChange={handlePopLayoutChange} />}
        <section aria-label="推荐内容" className="relative">
          {displayMode === "card" ? (
            <MusicRecommendGridList
              key={listKey}
              items={list}
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={loadMore}
              getScrollElement={getScrollElement}
              onMenuAction={handleMenuAction}
            />
          ) : (
            <MusicRecommendList
              key={listKey}
              items={list}
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={loadMore}
              getScrollElement={getScrollElement}
              onMenuAction={handleMenuAction}
            />
          )}
          {initialLoading && list.length === 0 && <PageState kind="loading" />}
          {!initialLoading && loadError && (
            <PageState kind="error" actionLabel="重新加载" onAction={() => void init()} />
          )}
          {!initialLoading && !loadError && list.length === 0 && <PageState kind="empty" />}
        </section>
      </div>
    </ScrollContainer>
  );
};

export default MusicRecommend;
