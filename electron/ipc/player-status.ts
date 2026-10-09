import log from "electron-log";

import { onTrustedIpc } from "../security/ipc";
import { channel } from "./channel";

/**
 * 主进程内存中的播放状态快照。
 *
 * 渲染进程通过 channel.player.state 推送快照（见 src/common/utils/player-status-bridge.ts），
 * 菜单栏/托盘（tray.ts）与 Windows 任务栏缩略按钮（thumbar.ts）订阅变化：
 * - tray：重建菜单（播放/暂停标签、静音勾选、当前歌名）与 tooltip
 * - thumbar：切换播放/暂停按钮图标
 */

const DEFAULT_STATUS: PlayerStatusSnapshot = {
  isPlaying: false,
  isMuted: false,
  volume: 0.5,
};

let status: PlayerStatusSnapshot = { ...DEFAULT_STATUS };

const listeners = new Set<(status: PlayerStatusSnapshot) => void>();

/** 只信任已知形状的字段，避免渲染端传入脏数据污染主进程状态 */
const sanitizeSnapshot = (snapshot: unknown): PlayerStatusSnapshot => {
  const source = (snapshot ?? {}) as Partial<PlayerStatusSnapshot>;

  return {
    isPlaying: source.isPlaying === true,
    isMuted: source.isMuted === true,
    volume:
      typeof source.volume === "number" && Number.isFinite(source.volume)
        ? Math.min(1, Math.max(0, source.volume))
        : status.volume,
    title: typeof source.title === "string" && source.title !== "" ? source.title : undefined,
    artist: typeof source.artist === "string" && source.artist !== "" ? source.artist : undefined,
  };
};

export const registerPlayerStatusIpc = () => {
  onTrustedIpc(channel.player.state, (_, snapshot: unknown) => {
    status = sanitizeSnapshot(snapshot);
    listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        log.error("[player-status] status listener failed:", error);
      }
    });
  });
};

export const getPlayerStatus = () => status;

export const subscribePlayerStatus = (listener: (status: PlayerStatusSnapshot) => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
