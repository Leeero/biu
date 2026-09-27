import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Chip, Listbox, ListboxItem } from "@heroui/react";
import { useClickAway, useRequest } from "ahooks";
import classNames from "classnames";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import { resolveSearchPlaceholder } from "@/layout/route-shell";
import { getSearchSuggestMain } from "@/service/main-suggest";
import { useSearchHistory } from "@/store/search-history";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";
import { TopBarSearch } from "@/ui/primitives/topbar-search";

import { isSearchShortcut, isTypingTarget, normalizeSearchKeyword, shouldSubmitSearch } from "./search-model";

interface SearchFieldProps {
  onFocusChange?: (focused: boolean) => void;
}

/**
 * 顶栏搜索位。
 *
 * **外形全部交给 `TopBarSearch`**，本文件只剩业务：搜索建议、历史、快捷键、
 * 提交与跳转。这样 `/search` 页也能复用同一个外壳。
 *
 * 两件事必须留在这里，因为它们需要路由与用户态：
 *   1. `Ctrl/⌘ + K` 聚焦。设计稿里画了 `Ctrl K` 提示 —— **提示可见就必须可用**，
 *      所以同时注册全局快捷键，失焦与输入中不抢焦点。
 *   2. 点击搜索位之外关掉建议浮层。为此用到 `TopBarSearch` 的 `rootRef`：
 *      判断「点在不在里面」需要整个搜索位的边界，光有 input 不够。
 *
 * HeroUI 的 `Input` 仍是交互与无障碍底座（方案 §4.3）：键盘、焦点环、
 * clearable 都由它保证，不自己重写。
 */
const SearchField: React.FC<SearchFieldProps> = ({ onFocusChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser(s => s.user);

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

  // Ctrl/⌘ + K 聚焦：与设计稿里的 kbd 提示成对出现，不允许只画提示不接功能。
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event) || isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

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

  const submitSearch = (rawKeyword: string) => {
    if (!shouldSubmitSearch(rawKeyword)) {
      return;
    }
    const normalizedKeyword = normalizeSearchKeyword(rawKeyword);
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
    <TopBarSearch
      rootRef={containerRef}
      inputRef={inputRef}
      value={value}
      // 占位**逐页不同**（设计稿第 03 / 04 页与其余页不同）：真值在 spec-lock
      // 的 `globalChrome.search.placeholderByRoute`，契约在 `route-shell`。
      placeholder={resolveSearchPlaceholder(location.pathname)}
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
    >
      <div
        className={classNames(
          "absolute top-full left-0 z-100 mt-2 h-auto max-h-[80dvh] w-full min-w-[360px] overflow-hidden rounded-[var(--biu-radius-lg)] border border-[var(--biu-border)] bg-[var(--biu-surface-sunken)] shadow-[var(--biu-shadow-floating)] backdrop-blur-[var(--biu-blur-glass)]",
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
                      className="cursor-pointer text-xs text-[rgb(var(--biu-text-quaternary))] hover:text-[rgb(var(--biu-text-primary))]"
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
    </TopBarSearch>
  );
};

export default SearchField;
