import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Chip, Input, Listbox, ListboxItem } from "@heroui/react";
import { RiSearchLine } from "@remixicon/react";
import { useRequest, useClickAway } from "ahooks";
import classNames from "classnames";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import { getSearchSuggestMain } from "@/service/main-suggest";
import { useSearchHistory } from "@/store/search-history";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

import { normalizeSearchKeyword, shouldSubmitSearch } from "./model";

interface SearchInputProps {
  onFocusChange?: (focused: boolean) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onFocusChange }) => {
  const navigate = useNavigate();
  const user = useUser(s => s.user);

  const location = useLocation();
  const searchHistoryItems = useSearchHistory(s => s.items);
  const keyword = useSearchHistory(s => s.keyword);
  const addSearchHistory = useSearchHistory(s => s.add);
  const deleteSearchHistory = useSearchHistory(s => s.delete);
  const clearSearchHistory = useSearchHistory(s => s.clear);
  const showSearchHistory = useSettings(s => s.showSearchHistory);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(keyword);

  useClickAway(() => {
    setOpen(false);
  }, containerRef);

  const { data: suggestionsData } = useRequest(
    async () => {
      if (!shouldSubmitSearch(value)) {
        return [];
      }

      const res = await getSearchSuggestMain({ term: normalizeSearchKeyword(value), userid: user?.mid });
      return res?.result?.tag || [];
    },
    { debounceWait: 300, refreshDeps: [value] },
  );

  const submitSearch = (keyword: string) => {
    if (!shouldSubmitSearch(keyword)) {
      return;
    }
    const normalizedKeyword = normalizeSearchKeyword(keyword);
    addSearchHistory(normalizedKeyword);
    if (location.pathname !== "/search") {
      navigate("/search");
    }
    setOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (next && containerRef.current?.contains(next)) {
      return;
    }
    setOpen(false);
    onFocusChange?.(false);
  };

  return (
    <div ref={containerRef} className="relative w-[min(32vw,360px)] min-w-[280px]">
      <Input
        ref={inputRef}
        value={value}
        onValueChange={setValue}
        onKeyDown={e => {
          if (e.key === "Enter") {
            submitSearch(e.currentTarget.value);
            inputRef.current?.blur();
            setOpen(false);
          }
        }}
        onBlur={handleBlur}
        onFocus={() => {
          setOpen(true);
          onFocusChange?.(true);
        }}
        onClick={() => setOpen(true)}
        aria-label="搜索音乐视频或创作者"
        placeholder="搜索音乐视频或创作者"
        isClearable
        startContent={<RiSearchLine size={16} />}
        className="window-no-drag w-full"
        classNames={{
          input:
            "text-sm outline-none focus-visible:outline-none placeholder:text-[rgb(var(--biu-color-text-tertiary))]",
          inputWrapper:
            "h-10 rounded-full border border-transparent bg-[rgb(var(--biu-color-surface-hover))] px-4 shadow-none outline-none transition-[background-color,border-color,box-shadow] group-data-[focus=true]:border-primary/35 group-data-[focus=true]:bg-[rgb(var(--biu-color-surface-raised))] group-data-[focus=true]:shadow-[0_0_0_3px_hsl(var(--heroui-primary)/0.10)] group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:outline-none data-[hover=true]:bg-[rgb(var(--biu-color-surface-pressed))]",
        }}
      />
      <div
        className={classNames(
          "absolute top-full left-0 z-100 mt-2 h-auto max-h-[80dvh] w-full min-w-[360px] overflow-hidden rounded-[var(--biu-radius-lg)] border border-[rgb(var(--biu-color-border)/0.08)] bg-[rgb(var(--biu-color-surface-raised))] shadow-[var(--biu-shadow-floating)]",
          {
            hidden: !open,
            "flex flex-col": open,
          },
        )}
      >
        <OverlayScrollbarsComponent className="h-full flex-1 p-2" options={{ scrollbars: { autoHide: "leave" } }}>
          <Listbox
            aria-label="搜索建议"
            selectionMode="none"
            items={
              suggestionsData?.map(item => ({
                key: item.value,
                value: item.value,
                name: item.name,
              })) || []
            }
            emptyContent={<div className="flex items-center justify-center py-6">暂无搜索建议</div>}
            topContent={
              showSearchHistory &&
              searchHistoryItems.length > 0 && (
                <>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-sm font-medium">搜索历史</span>
                    <button
                      type="button"
                      className="cursor-pointer text-xs text-[rgb(var(--biu-color-text-tertiary))] hover:text-[rgb(var(--biu-color-text-primary))]"
                      onMouseDown={e => e.preventDefault()}
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        clearSearchHistory();
                        inputRef.current?.focus();
                      }}
                    >
                      清除全部
                    </button>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    {searchHistoryItems.slice(0, 10).map(item => (
                      <Chip
                        key={item.time}
                        isCloseable
                        size="sm"
                        radius="md"
                        onClose={() => {
                          deleteSearchHistory(item);
                          inputRef.current?.focus();
                        }}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setOpen(false);
                          setValue(item.value);
                          submitSearch(item.value);
                          inputRef.current?.blur();
                        }}
                        className="min-w-0 cursor-pointer"
                        classNames={{
                          content: "truncate",
                        }}
                      >
                        {item.value}
                      </Chip>
                    ))}
                  </div>
                </>
              )
            }
          >
            {item => (
              <ListboxItem
                key={item.key}
                onPress={() => {
                  setOpen(false);
                  setValue(item.value);
                  submitSearch(item.value);
                }}
                className="rounded-medium"
              >
                <span dangerouslySetInnerHTML={{ __html: item.name }} />
              </ListboxItem>
            )}
          </Listbox>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

export default SearchInput;
