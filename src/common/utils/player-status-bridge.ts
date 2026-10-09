import { usePlayList } from "@/store/play-list";

/**
 * 播放状态桥：把主窗口的播放状态快照推送给主进程，
 * 供 macOS 菜单栏 / Windows 托盘菜单展示当前歌名、播放/暂停标签与静音勾选态。
 *
 * - 只在主窗口启动：迷你窗口是独立 JS 上下文，且它本身就是被同步的一方；
 * - 订阅播放列表 store，相关字段变化时才推送，避免高频 timeupdate 刷屏。
 */
export function startPlayerStatusBridge(): () => void {
  if (typeof window === "undefined" || !window.electron || !window.electron.updatePlayerStatus) {
    return () => undefined;
  }

  // 迷你窗口不推送（与 toggleMiniMode 的窗口判定保持一致）
  if (window.location.hash.includes("mini-player")) {
    return () => undefined;
  }

  const getSnapshot = (): PlayerStatusSnapshot => {
    const { isPlaying, isMuted, volume, getPlayItem } = usePlayList.getState();
    const playItem = getPlayItem();

    return {
      isPlaying,
      isMuted,
      volume,
      title: playItem?.pageTitle || playItem?.title,
      artist: playItem?.source === "local" ? "本地音乐" : playItem?.ownerName,
    };
  };

  let last: PlayerStatusSnapshot | null = null;

  const pushIfChanged = () => {
    const snapshot = getSnapshot();

    if (
      last &&
      last.isPlaying === snapshot.isPlaying &&
      last.isMuted === snapshot.isMuted &&
      last.volume === snapshot.volume &&
      last.title === snapshot.title &&
      last.artist === snapshot.artist
    ) {
      return;
    }

    last = snapshot;
    window.electron.updatePlayerStatus(snapshot);
  };

  // 启动时先推一次，让菜单初始状态就正确（例如应用启动后恢复播放中状态）
  pushIfChanged();

  return usePlayList.subscribe(pushIfChanged);
}
