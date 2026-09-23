import { BrowserWindow } from "electron";
import isDev from "electron-is-dev";

import { createMiniPlayer, destroyMiniPlayer, miniPlayer } from "../mini-player";
import { channel } from "./channel";

export function registerWindowHandlers({ getMainWindow }) {
  onTrustedIpc(channel.window.minimize, event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  onTrustedIpc(channel.window.toggleMaximize, event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  onTrustedIpc(channel.window.close, event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  handleTrustedIpc(channel.window.isMaximized, event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized() ?? false;
  });

  handleTrustedIpc(channel.window.isFullScreen, event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isFullScreen() ?? false;
  });

  handleTrustedIpc(channel.window.toggleMini, () => {
    const mainWindow = getMainWindow?.();
    if (miniPlayer && !miniPlayer.isDestroyed()) {
      destroyMiniPlayer();
      mainWindow?.show();
    } else {
      mainWindow?.hide();
      createMiniPlayer();
    }
  });

  onTrustedIpc(channel.window.toggleDevTools, event => {
    if (!isDev) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.webContents.toggleDevTools();
  });
}
import { handleTrustedIpc, onTrustedIpc } from "../security/ipc";
