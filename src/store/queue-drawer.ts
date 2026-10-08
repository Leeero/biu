import { create } from "zustand";

interface QueueDrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/** 队列抽屉只保存展示状态；队列数据始终来自 usePlayList，与 /queue 页面共享。 */
export const useQueueDrawer = create<QueueDrawerState>(set => ({
  open: false,
  setOpen: open => set({ open }),
  toggle: () => set(state => ({ open: !state.open })),
}));
