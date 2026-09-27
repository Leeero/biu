import React, { useEffect, useRef, useState } from "react";

import { Tabs, Tab } from "@heroui/react";

import Empty from "@/components/empty";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { PLAYLIST_DETAIL_TRACK_ACTIONS } from "@/features/playlist/track-actions";
import { useSearchFixture, useSearchFixtureData } from "@/features/search/fixture";
import { SearchView } from "@/features/search/search-view";
import { useSearchHistory } from "@/store/search-history";
import { useSearchSegments } from "@/store/search-segments";
import { AnnotationBand } from "@/ui/patterns/annotation-band";

import { SearchType, SearchTypeOptions } from "./search-type";
import UserList from "./user-list";
import VideoList from "./video-list";

/**
 * 屏 06 的夹具渲染（`?fixture=06-search`）。
 *
 * 注解带放在 `<SearchView>` 的**兄弟**位置：它 `position: absolute; top 598`
 * （`anchor="high"`，屏 06 的 noteTop 容器相对值），定位上下文是壳层 `<main>`，
 * 必须落在滚动容器之外（见屏 01 LibraryView 的同款说明）。
 *
 * 顶栏分段「音乐视频 · 9 / 创作者 · 2」的尾巴是**运行时结果数**：夹具路径在此
 * 把 `useSearchSegments.setCounts` 写入，`Layout` 组合出最终标签（spec-lock
 * `topbarSegments.labelSources`，1.3.12）。
 */
const FixtureSearch = () => {
  const fixture = useSearchFixtureData();
  const setCounts = useSearchSegments(state => state.setCounts);

  useEffect(() => {
    if (fixture) setCounts(fixture.counts);
  }, [fixture, setCounts]);

  if (!fixture) return null;

  return (
    <>
      <SearchView
        query={fixture.query}
        localLink={fixture.localLink}
        lead={fixture.lead}
        videoSectionTitle={fixture.videoSectionTitle}
        videos={fixture.videos}
        creatorSectionTitle={fixture.creatorSectionTitle}
        creators={fixture.creators}
        rowActions={PLAYLIST_DETAIL_TRACK_ACTIONS}
        demoActionRowIds={fixture.demoActionRowIds}
        onQueryChange={() => {
          /* 夹具模式不触网：比对需要画面稳定。 */
        }}
        onLocalLinkPress={() => {
          /* 夹具模式不跳转。 */
        }}
        onRowAction={() => {
          /* 夹具模式不触网。 */
        }}
      />
      {/* 文字跨度收 1216px 复现设计的两行断点（行 2 = 「主操作。」）——
          Chrome 排版比设计稿 PDF 窄，不收宽度会排成一行。
          spec-lock meta.revisions 1.3.14（字体度量差补偿）。 */}
      <AnnotationBand anchor="high" className="[&>span:last-child]:max-w-[1216px]">
        {fixture.note}
      </AnnotationBand>
    </>
  );
};

const Search = () => {
  const fixtureEnabled = useSearchFixture();
  const scrollerRef = useRef<ScrollRefObject>(null);
  const [searchType, setSearchType] = useState(SearchType.Video);
  const keyword = useSearchHistory(s => s.keyword);

  if (fixtureEnabled) {
    return <FixtureSearch />;
  }

  if (!keyword) {
    return <Empty />;
  }

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <div className="w-full pt-5 pb-8">
        <div className="mb-4">
          <h1 className="m-0 text-[length:var(--biu-type-page-title-size)] leading-[var(--biu-type-page-title-leading)] font-semibold tracking-[var(--biu-type-page-title-tracking)] text-[rgb(var(--biu-text-primary))]">
            {`“${keyword}”的搜索结果`}
          </h1>
          <p className="mt-2 text-[length:var(--biu-type-lead-size)] leading-7 tracking-[-0.2px] text-[rgb(var(--biu-text-secondary))]">
            结果来自 B 站搜索，可按音乐视频或创作者查看。
          </p>
        </div>
        <div className="mb-5 flex items-center justify-between border-b border-[rgb(var(--biu-color-border)/0.06)] pb-3">
          <Tabs
            aria-label="搜索结果类型"
            variant="light"
            radius="full"
            classNames={{
              tabList: "gap-1 bg-[rgb(var(--biu-color-surface-hover))] p-1 rounded-full",
              cursor: "rounded-full bg-[rgb(var(--biu-color-surface-raised))] shadow-sm",
              tabContent: "group-data-[selected=true]:text-primary font-medium",
            }}
            items={SearchTypeOptions}
            selectedKey={searchType}
            onSelectionChange={v => {
              setSearchType(v as SearchType);
            }}
          >
            {item => <Tab key={item.value} title={item.label} />}
          </Tabs>
        </div>
        {searchType === SearchType.Video && (
          <VideoList
            keyword={keyword}
            getScrollElement={() => scrollerRef.current?.osInstance()?.elements().viewport || null}
          />
        )}
        {searchType === SearchType.User && (
          <UserList
            keyword={keyword}
            getScrollElement={() => scrollerRef.current?.osInstance()?.elements().viewport || null}
          />
        )}
      </div>
    </ScrollContainer>
  );
};

export default Search;
