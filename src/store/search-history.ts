import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SearchItem {
  value: string;
  time: number;
}

export interface SearchHistoryState {
  /**
   * 当前查询词。**只活在本次会话里**，见下方 `partialize` 的说明。
   * 消费者只有 `/search` 页（用它渲染标题与发起请求）。
   */
  keyword: string;
  items: SearchItem[];
}

export interface SearchHistoryAction {
  add: (value: string) => void;
  delete: (item: SearchItem) => void;
  clear: () => void;
}

export const useSearchHistory = create<SearchHistoryState & SearchHistoryAction>()(
  persist(
    (set, get) => ({
      keyword: "",
      items: [],
      add: value => {
        const { items } = get();
        const newItem = { value, time: Date.now() };

        if (items.some(i => i.value === value)) {
          set({ keyword: value, items: [newItem, ...items.filter(i => i.value !== value)] });
        } else {
          set({ keyword: value, items: [newItem, ...items] });
        }
      },
      delete: item => set(state => ({ items: state.items.filter(i => i.value !== item.value) })),
      clear: () => set({ keyword: "", items: [] }),
    }),
    {
      name: "search-history",
      /**
       * 只持久化搜索历史（PRD 要求「本地保存、可展示、可开关」）。
       *
       * `keyword` **刻意不落盘**：它是「当前查询词」，一旦持久化，下次启动顶栏
       * 搜索框与 `/search` 页都会带着上一次的结果出现 —— 用户看到的就是
       * 「搜索框被自动填充上一次的搜索记录」（2026-10-09 修）。
       */
      partialize: state => ({ items: state.items }),
      /**
       * 1 = 把 `keyword` 移出持久化。
       *
       * 必须升版：老用户 localStorage 里那份数据**已经存过** `keyword`，
       * 水合时会把它合并回内存，光改 `partialize` 治不了存量数据。
       */
      version: 1,
      migrate: persisted => ({ items: (persisted as Partial<SearchHistoryState> | null)?.items ?? [] }),
    },
  ),
);
