import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

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
  const [searchParams] = useSearchParams();
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
        demoActionRowIds={searchParams.get("preview") === "4188" ? [] : fixture.demoActionRowIds}
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
      {searchParams.get("preview") !== "4188" && (
        <AnnotationBand anchor="high" className="[&>span:last-child]:max-w-[1216px]">
          {fixture.note}
        </AnnotationBand>
      )}
    </>
  );
};

const Search = () => {
  const fixtureEnabled = useSearchFixture();
  const navigate = useNavigate();
  const scrollerRef = useRef<ScrollRefObject>(null);
  const [searchType, setSearchType] = useState(SearchType.All);
  const keyword = useSearchHistory(s => s.keyword);

  if (fixtureEnabled) {
    return <FixtureSearch />;
  }

  if (!keyword) {
    return <Empty />;
  }

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <div className="social4188-page search4188-page">
        <header className="social4188-head">
          <span>全局搜索</span>
          <h1>{`“${keyword}”的搜索结果`}</h1>
          <p>音乐视频与创作者来自 B 站；播放列表仅检索我的音乐，不扩展远程搜索范围。</p>
        </header>
        <div className="social4188-tabs" role="tablist" aria-label="搜索结果类型">
          {SearchTypeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={searchType === option.value}
              className={searchType === option.value ? "is-active" : undefined}
              onClick={() => setSearchType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {(searchType === SearchType.All || searchType === SearchType.Video) && (
          <section className="social4188-section">
            <h2>音乐视频</h2>
            <VideoList
              keyword={keyword}
              getScrollElement={() => scrollerRef.current?.osInstance()?.elements().viewport || null}
            />
          </section>
        )}
        {searchType === SearchType.User && (
          <section className="social4188-section">
            <h2>创作者</h2>
            <UserList
              keyword={keyword}
              getScrollElement={() => scrollerRef.current?.osInstance()?.elements().viewport || null}
            />
          </section>
        )}
        {searchType === SearchType.Playlist && (
          <div className="social4188-local-result">
            <span>来自我的音乐</span>
            <h2>在已有播放列表中查找“{keyword}”</h2>
            <p>这里不会发起新的远程请求；进入我的音乐后可继续查看本地目录、收藏夹、合集与系列。</p>
            <button type="button" onClick={() => navigate("/library")}>
              前往我的音乐
            </button>
          </div>
        )}
      </div>
    </ScrollContainer>
  );
};

export default Search;
