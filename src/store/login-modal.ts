import { create } from "zustand";

interface LoginModalState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * 登录弹窗的全局开关。
 *
 * 登录入口有两处：侧栏账户菜单，以及各页登录门禁的「去登录」按钮。弹窗本身挂在
 * `Layout`（全局层）—— 之前它藏在账户菜单内部，页面的门禁按钮够不到它，于是
 * `/library`、`/follow` 只能写一句「登录后查看…」却没有出口。
 */
export const useLoginModal = create<LoginModalState>(set => ({
  open: false,
  setOpen: open => set({ open }),
}));

/** 打开登录弹窗。给事件处理器等不便订阅 store 的地方用。 */
export const openLoginModal = () => useLoginModal.getState().setOpen(true);
