import { addToast } from "@heroui/react";

import { toggleMiniMode } from "@/common/utils/mini-player";
import { openLoginModal } from "@/store/login-modal";
import { useModalStore } from "@/store/modal";
import { useMusicFavStore } from "@/store/music-fav";
import { usePlayList } from "@/store/play-list";
import { useUser } from "@/store/user";

const VOLUME_STEP = 0.05;

const PLAYER_COMMANDS: readonly PlayerCommand[] = [
  "togglePlay",
  "prev",
  "next",
  "volumeUp",
  "volumeDown",
  "toggleMute",
  "toggleMiniMode",
  "favorite",
];

/**
 * ShortcutCommand 里含有非播放器动作的项（如 toggleLyrics，仓库中尚未实现），
 * 用它把快捷键命令收敛到可执行的播放器命令上。
 */
export const isPlayerCommand = (command: string): command is PlayerCommand =>
  (PLAYER_COMMANDS as readonly string[]).includes(command);

const clampVolume = (volume: number) => Math.min(1, Math.max(0, Math.round(volume * 100) / 100));

/** 收藏当前播放的歌曲：复用全局收藏夹选择弹窗，未登录时引导登录 */
export const openFavoriteForCurrentTrack = () => {
  const playItem = usePlayList.getState().getPlayItem();

  if (!playItem) {
    addToast({ title: "当前没有正在播放的歌曲", color: "warning" });
    return;
  }

  if (playItem.source === "local") {
    addToast({ title: "本地音乐暂不支持收藏", color: "warning" });
    return;
  }

  if (!useUser.getState().user?.isLogin) {
    openLoginModal();
    addToast({ title: "登录后即可收藏", color: "warning" });
    return;
  }

  useModalStore.getState().onOpenFavSelectModal({
    rid: playItem.type === "mv" ? String(playItem.aid) : String(playItem.sid),
    type: playItem.type === "mv" ? 2 : 12,
    title: "收藏",
    onSuccess: selectedIds => {
      useMusicFavStore.getState().setIsFav(Boolean(selectedIds?.length));
    },
  });
};

/**
 * 统一的播放命令分发器：主进程（macOS 菜单栏 / Windows 托盘 / 任务栏缩略按钮）、
 * 全局快捷键、应用内快捷键三路命令都收敛到这里执行。
 *
 * 迷你窗口是独立的 JS 上下文（自己的 store 与 audio），不应响应命令 ——
 * 否则托盘切歌时迷你窗口也会去拉流播放，出现双声道。命令一律由主窗口处理。
 */
export const runPlayerCommand = (command: PlayerCommand) => {
  if (window.location.hash.includes("mini-player")) {
    return;
  }

  const { togglePlay, prev, next, setVolume, toggleMute, volume } = usePlayList.getState();

  switch (command) {
    case "togglePlay":
      void togglePlay();
      break;
    case "prev":
      void prev();
      break;
    case "next":
      void next();
      break;
    case "volumeUp":
      setVolume(clampVolume(volume + VOLUME_STEP));
      break;
    case "volumeDown":
      setVolume(clampVolume(volume - VOLUME_STEP));
      break;
    case "toggleMute":
      toggleMute();
      break;
    case "toggleMiniMode":
      void toggleMiniMode();
      break;
    case "favorite":
      openFavoriteForCurrentTrack();
      break;
    default:
      break;
  }
};
