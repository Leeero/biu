import React, { useRef, useState } from "react";

import { Tabs, Tab } from "@heroui/react";

import Empty from "@/components/empty";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { useSearchHistory } from "@/store/search-history";
import { PageHeader } from "@/ui/patterns/page-header";

import { SearchType, SearchTypeOptions } from "./search-type";
import UserList from "./user-list";
import VideoList from "./video-list";

const Search = () => {
  const scrollerRef = useRef<ScrollRefObject>(null);
  const [searchType, setSearchType] = useState(SearchType.Video);
  const keyword = useSearchHistory(s => s.keyword);

  if (!keyword) {
    return <Empty />;
  }

  return (
    <ScrollContainer enableBackToTop ref={scrollerRef} className="h-full w-full">
      <div className="w-full pt-5 pb-8">
        <PageHeader
          title={`“${keyword}”的搜索结果`}
          description="结果来自 B 站搜索，可按音乐视频或创作者查看。"
          className="mb-4"
        />
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
