import React, { useCallback, useEffect, useRef, useState } from "react";

import { addToast, Tab, Tabs } from "@heroui/react";
import { RiPlayFill } from "@remixicon/react";

import type { Track } from "@/domain/track";

import { getTrackSourceUrl, toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRankItemToTrack, adaptRegionArchiveToTrack } from "@/adapters/track/recommendation";
import AsyncButton from "@/components/async-button";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { DiscoverListView, discoverListColumns } from "@/features/discover/discover-list-view";
import { DiscoverView } from "@/features/discover/discover-view";
import {
  useDiscoverFixtureData,
  useDiscoverFixtureName,
  useDiscoverListFixtureData,
} from "@/features/discover/fixture";
import { DISCOVER_LIST_TRACK_ACTIONS } from "@/features/discover/track-actions";
import { getMusicComprehensiveWebRank, type Data as MusicItem } from "@/service/music-comprehensive-web-rank";
import { getRegionFeedRcmd, type Archive } from "@/service/web-interface-region-feed-rcmd";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { DISCOVER_CARD_FIXTURE_NAME } from "@/ui/fixtures/screen-07-discover-card";
import { DISCOVER_LIST_FIXTURE_NAME } from "@/ui/fixtures/screen-08-discover-list";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
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

/**
 * 真实数据路径的发现音乐页。
 *
 * **处置说明（屏 07 / 08 验收后的常态）**：两屏的呈现层都已落地 —— 卡片态在
 * `DiscoverView`、列表态在 `DiscoverListView`，夹具路径
 * （`?fixture=07-discover-card` / `?fixture=08-discover-list`）走的就是它们。
 * 真实路径仍用下面这套既有实现，**这是有意保留的**，不是遗漏：
 *
 * 把它迁到同一套骨架要先把 new/music 从 `NewMusicTop` 内部的自取数据里提出来
 * （设计稿第 8 页的两段主体内容都来自 new/music：首段是 banner 大卡、第二段是
 * 它的方形封面专辑卡），并同时接线顶栏分段「音乐分区 | 单一模块」。这两件事
 * 必须一起做 —— 分段组是**数据源**切换，先接线会造出一个点了没反应的控件，
 * 而只迁呈现层又会留下「页面里两套分区切换」的中间态。
 *
 * 因此本页真实路径的迁移**没有随屏 07 / 08 收口**，欠账登记在
 * `src/layout/route-shell.ts` 的 `DEFERRED_SEGMENTS["/"]`（那里写着确切的
 * 阻塞条件，且该条目受 `tests/app-shell-interactions.test.ts` 与真值
 * `topbarSegments.byRoute` 双向看守）。**在它落地之前，本页真实路径保持不动**
 * —— 迁移中的半成品比旧实现更难判断。
 */
const MusicRecommendLive = () => {
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

/**
 * 屏 07 的夹具渲染（`?fixture=07-discover-card`）。
 *
 * 容器与真实路径同款（`ScrollContainer` + 满幅 div），**不再自加上边距** ——
 * 壳层的 `<main>` 已经给了 `pt-[var(--biu-layout-content-pt)]`（33）与左右 64 的
 * 留白，页面再补一层就会把 H1 顶下去（这正是本屏 `prototypeBaseline` 里
 * 「渲染比设计高 10–20px」的成因之一）。
 */
const FixtureDiscover = () => {
  const fixture = useDiscoverFixtureData();

  if (!fixture) return null;

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <div className="w-full pb-8">
        <DiscoverView
          title={fixture.title}
          lead={fixture.lead}
          filters={fixture.filters}
          heroSectionTitle={fixture.heroSectionTitle}
          hero={fixture.hero}
          albumSectionTitle={fixture.albumSectionTitle}
          albums={fixture.albums}
          note={fixture.note}
        />
      </div>
    </ScrollContainer>
  );
};

/**
 * 屏 08 的夹具渲染（`?fixture=08-discover-list`）。
 *
 * 与卡片分支的两处不同，都是真值要求的，不要「统一」掉：
 *
 * 1. **注解带是 `<ScrollContainer>` 的兄弟**，不在 `DiscoverListView` 里。设计页
 *    第 9 页的注解带（墨迹 728–760）落在 900 视口之内，必须用 `AnnotationBand`
 *    缺省锚点（`top: 653`，相对内容区顶）—— 而缺省锚点是**绝对定位**，定位上下文
 *    是壳层的 `<main>`（`relative`，起于 y=71，71 + 653 = 724 ✓）。`ScrollContainer`
 *    自己的根是 `position: relative`（overlayscrollbars 的 `[data-overlayscrollbars]`
 *    规则、起于 y=104），排在它内部会落到 757、低 33px。屏 02 的
 *    `FixturePlaylistDetail` 采用同一处置。
 * 2. **没有 `pb-8` 包裹层**：`DiscoverListView` 的根就是滚动容器，再套一层内边距
 *    只会把内容顶下去（壳层 `<main>` 已经给了上 33、左右 64）。
 */
const FixtureDiscoverList = () => {
  const fixture = useDiscoverListFixtureData();

  if (!fixture) return null;

  return (
    <>
      <DiscoverListView
        title={fixture.title}
        lead={fixture.lead}
        filters={fixture.filters}
        sectionTitle={fixture.sectionTitle}
        columns={discoverListColumns(fixture.head)}
        tracks={fixture.tracks}
        rowActions={DISCOVER_LIST_TRACK_ACTIONS}
        demoActionRowIds={fixture.demoActionRowIds}
        onPillPress={() => {
          /* 夹具模式不触网、不切换展示模式：比对需要画面稳定。 */
        }}
        onRowAction={() => {
          /* 夹具模式不触网。 */
        }}
      />
      <AnnotationBand>{fixture.note}</AnnotationBand>
    </>
  );
};

/**
 * 发现音乐（`/`）。
 *
 * 三条路径在**这一层**分流，而不是在组件内部 early return：真实路径的 hooks
 * 数量远多于两条夹具路径（十余个 useState / useRef / useEffect），条件返回会让
 * 同一个组件实例前后渲染出不同数量的 hooks；枚举夹具名同样是为了让「本路由有
 * 哪几条分支」在代码里可数。
 */
const MusicRecommend = () => {
  const fixtureName = useDiscoverFixtureName();

  if (fixtureName === DISCOVER_CARD_FIXTURE_NAME) return <FixtureDiscover />;
  if (fixtureName === DISCOVER_LIST_FIXTURE_NAME) return <FixtureDiscoverList />;

  return <MusicRecommendLive />;
};

export default MusicRecommend;
