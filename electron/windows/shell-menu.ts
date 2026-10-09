import type { MenuItemConstructorOptions } from "electron";

/**
 * 菜单栏（macOS）/ 托盘（Windows、Linux）共用的菜单模板。
 *
 * 纯函数、不依赖 electron 运行时（仅类型），行为由 tests/shell-menu.test.ts 契约钉住：
 * - 播放状态会反映在标签与勾选态上（播放/暂停、静音、当前歌名）
 * - 未播放时不提供收藏入口（没有可收藏的对象）
 */
export interface ShellMenuActions {
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onFavorite: () => void;
  onToggleMiniMode: () => void;
  onToggleMainWindow: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
}

const MAX_MENU_TITLE_LENGTH = 32;

const truncateTitle = (title: string) =>
  title.length > MAX_MENU_TITLE_LENGTH ? `${title.slice(0, MAX_MENU_TITLE_LENGTH - 1)}…` : title;

export const buildShellMenuTemplate = (
  status: PlayerStatusSnapshot,
  actions: ShellMenuActions,
): MenuItemConstructorOptions[] => {
  const hasCurrentTrack = Boolean(status.title);
  const currentTrackLabel = hasCurrentTrack
    ? truncateTitle(status.artist ? `${status.title} - ${status.artist}` : (status.title as string))
    : "未在播放";

  return [
    {
      label: currentTrackLabel,
      enabled: false,
    },
    {
      type: "separator",
    },
    {
      label: status.isPlaying ? "暂停" : "播放",
      click: actions.onTogglePlay,
    },
    {
      label: "上一曲",
      click: actions.onPrev,
    },
    {
      label: "下一曲",
      click: actions.onNext,
    },
    {
      type: "separator",
    },
    {
      label: "增大音量",
      click: actions.onVolumeUp,
    },
    {
      label: "减小音量",
      click: actions.onVolumeDown,
    },
    {
      label: "静音",
      type: "checkbox",
      checked: status.isMuted,
      click: actions.onToggleMute,
    },
    {
      type: "separator",
    },
    {
      label: "收藏当前歌曲…",
      enabled: hasCurrentTrack,
      click: actions.onFavorite,
    },
    {
      label: "迷你播放器",
      click: actions.onToggleMiniMode,
    },
    {
      label: "显示/隐藏主界面",
      click: actions.onToggleMainWindow,
    },
    {
      type: "separator",
    },
    {
      label: "设置…",
      click: actions.onOpenSettings,
    },
    {
      label: "退出 Biu",
      click: actions.onQuit,
    },
  ];
};
