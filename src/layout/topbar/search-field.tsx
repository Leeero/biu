import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Chip, Input, Listbox, ListboxItem } from "@heroui/react";
import { RiSearchLine } from "@remixicon/react";
import { useClickAway, useRequest } from "ahooks";
import classNames from "classnames";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import { getSearchSuggestMain } from "@/service/main-suggest";
import { useSearchHistory } from "@/store/search-history";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

import { isSearchShortcut, isTypingTarget, normalizeSearchKeyword, shouldSubmitSearch } from "./search-model";

interface SearchFieldProps {
  onFocusChange?: (focused: boolean) => void;
}

/**
 * 顶栏搜索位。
 *
 * 交互（搜索建议、历史、清空）沿用上一轮实现，本次只做三件事：
 *   1. 视觉对齐 C+ 顶栏空白（400 × 40、药丸、`--biu-surface-field` 底、占位符弱化）。
 *   2. 补上设计稿里那个 `Ctrl K` 提示——**提示可见就必须可用**，
 *      因此同时注册了全局快捷键（Ctrl 与 ⌘ 都接受），失焦/输入中不抢焦点。
 *   3. 令牌替换：不再引用 `--heroui-primary` 与遗留 `--biu-color-*`。
 *
 * 保持 HeroUI 的 Input 作为交互与无障碍底座（重构方案 §4.3）：
 * 键盘、焦点环、clearable 都由它保证，不自己重写。
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
    <div ref={containerRef} className="relative w-[min(32vw,400px)] min-w-[240px]">
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
        startContent={<RiSearchLine size={20} className="text-[rgb(var(--biu-text-quaternary))]" />}
        endContent={
          <kbd
            aria-hidden="true"
            className="flex h-6 flex-none items-center rounded-[7px] bg-[rgb(var(--biu-text-primary)/0.28)] px-2 text-[length:var(--biu-type-micro-size)] tracking-[0.2px] text-[rgb(var(--biu-film))]"
          >
            Ctrl K
          </kbd>
        }
        className="window-no-drag w-full"
        classNames={{
          input:
            "text-[length:var(--biu-type-body-size)] outline-none focus-visible:outline-none placeholder:text-[var(--biu-text-placeholder)]",
          inputWrapper:
            "h-10 rounded-[var(--biu-radius-pill)] border border-transparent bg-[var(--biu-surface-field)] px-4 text-[rgb(var(--biu-text-primary))] shadow-none outline-none transition-[background-color,border-color,box-shadow] group-data-[focus=true]:border-[var(--biu-glass-border)] group-data-[focus=true]:bg-[var(--biu-surface-field)] group-data-[focus=true]:shadow-[0_0_0_3px_var(--biu-accent-soft)] group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:outline-none",
        }}
      />
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
    </div>
  );
};

export default SearchField;
