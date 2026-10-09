import type { BrowserWindow } from "electron";

import { Tray, nativeImage, Menu } from "electron";
import isDev from "electron-is-dev";
import log from "electron-log";
import path from "node:path";

import { ELECTRON_ICON_BASE_PATH } from "@shared/path";

import { channel } from "../ipc/channel";
import { getPlayerStatus, subscribePlayerStatus } from "../ipc/player-status";
import { destroyMiniPlayer } from "../mini-player";
import { IconBase } from "../utils";
import { buildShellMenuTemplate } from "./shell-menu";

interface Props {
  getMainWindow: () => BrowserWindow | null;
  onExit: () => void;
}

/**
 * 系统状态栏图标：
 * - macOS：屏幕右上角菜单栏图标（系统菜单栏惯例，点击弹出菜单）
 * - Windows/Linux：系统托盘
 *
 * 左键行为按平台区分：
 * - macOS：点击弹出菜单（setContextMenu 自动接管），不在此处切换窗口可见性
 * - Windows/Linux：左键显示/聚焦主窗口；右键弹出菜单
 *
 * 菜单模板由 shell-menu.ts 纯函数生成，播放状态变化时重建菜单。
 */
let tray: Tray | null = null;
let unsubscribeStatus: (() => void) | null = null;

const loadTrayIcon = () => {
  const isLinux = process.platform === "linux";
  // macOS 菜单栏使用模板图（黑 + alpha），系统自动适配明暗菜单栏；
  // 文件名以 Template 结尾时 Electron 会自动按模板图加载，@2x 由 nativeImage 自动匹配。
  const iconName =
    process.platform === "darwin" ? "trayTemplate.png" : isLinux ? "logo.png" : isDev ? "dev.ico" : "tray.ico";
  const trayIconPath = path.resolve(IconBase, ELECTRON_ICON_BASE_PATH, iconName);
  let icon = nativeImage.createFromPath(trayIconPath);

  if (icon.isEmpty()) {
    log.warn(`[tray] Tray icon not found or failed to load: ${trayIconPath}`);
  }

  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }

  // Linux 下为了避免图标过大，调整尺寸（通常 32x32 足够清晰且适配）
  if (isLinux) {
    icon = icon.resize({ width: 32, height: 32 });
  }

  return icon;
};

function createTray({ getMainWindow, onExit }: Props) {
  // 若已存在旧实例，先销毁避免重复创建
  if (tray) {
    destroyTray();
  }

  const sendPlayerCommand = (command: PlayerCommand, errorContext: string) => {
    return () => {
      const win = getMainWindow?.();
      if (!win || win.isDestroyed()) {
        return;
      }
      try {
        win.webContents.send(channel.player.command, command);
      } catch (err) {
        log.error(`[tray] ${errorContext} failed:`, err);
      }
    };
  };

  /**
   * 切换主窗口的显示/隐藏状态
   */
  const toggleMainWindowVisibility = () => {
    const win = getMainWindow?.();
    if (!win || win.isDestroyed()) return;
    try {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    } catch (err) {
      log.error("[tray] toggle main window visibility failed:", err);
    }
  };

  const navigateToSettings = () => {
    const win = getMainWindow?.();
    if (!win || win.isDestroyed()) return;
    try {
      win.show();
      win.focus();
      win.webContents.send(channel.router.navigate, "/settings");
    } catch (err) {
      log.error("[tray] navigate to settings failed:", err);
    }
  };

  const actions = {
    onTogglePlay: sendPlayerCommand("togglePlay", "toggle play"),
    onPrev: sendPlayerCommand("prev", "play previous"),
    onNext: sendPlayerCommand("next", "play next"),
    onVolumeUp: sendPlayerCommand("volumeUp", "volume up"),
    onVolumeDown: sendPlayerCommand("volumeDown", "volume down"),
    onToggleMute: sendPlayerCommand("toggleMute", "toggle mute"),
    onFavorite: sendPlayerCommand("favorite", "favorite current track"),
    onToggleMiniMode: sendPlayerCommand("toggleMiniMode", "toggle mini mode"),
    onToggleMainWindow: toggleMainWindowVisibility,
    onOpenSettings: navigateToSettings,
    onQuit: () => {
      // 将退出逻辑交给主进程，以便设置 app.quitting 标记
      if (typeof onExit === "function") {
        onExit();
      }
    },
  };

  const rebuildMenu = () => {
    if (!tray) return;
    try {
      // Linux 下必须使用 setContextMenu 才能正常弹出菜单（尤其是 Wayland/AppIndicator 环境）
      // macOS/Windows 也推荐使用 setContextMenu，系统会自动处理点击行为
      tray.setContextMenu(Menu.buildFromTemplate(buildShellMenuTemplate(getPlayerStatus(), actions)));
    } catch (err) {
      log.error("[tray] rebuild menu failed:", err);
    }
  };

  const updateTooltip = () => {
    if (!tray) return;
    const { title } = getPlayerStatus();
    try {
      tray.setToolTip(title ? `Biu - ${title}` : "Biu");
    } catch (err) {
      log.warn("[tray] update tooltip failed:", err);
    }
  };

  tray = new Tray(loadTrayIcon());
  tray.setToolTip("Biu");

  rebuildMenu();
  unsubscribeStatus = subscribePlayerStatus(() => {
    rebuildMenu();
    updateTooltip();
  });

  // 左键单击（仅 Windows/Linux）：显示主窗口；若迷你窗口已显示，则关闭它
  // macOS 上 setContextMenu 会让左键弹出菜单，不能再叠加窗口切换行为
  if (process.platform !== "darwin") {
    tray.on("click", () => {
      destroyMiniPlayer();
      const win = getMainWindow?.();
      if (!win || win.isDestroyed()) return;
      if (win.isVisible()) {
        if (!win.isFocused()) {
          win.focus();
        }
      } else {
        win.show();
      }
    });
  }

  return tray;
}

function destroyTray() {
  if (unsubscribeStatus) {
    unsubscribeStatus();
    unsubscribeStatus = null;
  }
  if (tray) {
    try {
      tray.destroy();
    } catch (err) {
      log.warn("[tray] destroy tray failed:", err);
    }
    tray = null;
  }
}

export { createTray, destroyTray };
