import { BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import log from "electron-log";
import electronUpdater, { type UpdateDownloadedEvent } from "electron-updater";
import path from "node:path";

import { channel } from "../ipc/channel";

const { autoUpdater } = electronUpdater;

let checkForUpdatesInterval: NodeJS.Timeout | null = null;

const checkForUpdatesSafely = async () => {
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log.warn("[updater] Failed to check for updates:", error);
  }
};

function setupAutoUpdater({ getMainWindow }: { getMainWindow: () => BrowserWindow | null }) {
  autoUpdater.logger = log;
  log.transports.file.level = "info";
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = true;

  if (isDev) {
    autoUpdater.updateConfigPath = path.resolve(process.cwd(), "electron/updater/dev-app-update.yml");
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.autoRunAppAfterInstall = false;
  }

  autoUpdater.on("update-available", info => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send(channel.app.onUpdateAvailable, {
      latestVersion: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on("download-progress", progressObj => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send(channel.app.updateMessage, {
      status: "downloading",
      processInfo: progressObj,
    });
  });

  autoUpdater.on("error", error => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send(channel.app.updateMessage, {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  });

  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send(channel.app.updateMessage, {
      status: "downloaded",
      downloadInfo: {
        filePath: info.downloadedFile,
      },
    });
  });

  // 开发环境由 HMR 提供代码更新，不应在每次 `pnpm dev` 启动时访问 GitHub
  // Releases。保留上面的配置与事件监听，使设置页的“手动检查更新”仍可显式
  // 调用 IPC；这里只禁止无用户操作的启动检查和每小时轮询。
  if (isDev) return;

  void checkForUpdatesSafely();
  checkForUpdatesInterval = setInterval(
    () => {
      void checkForUpdatesSafely();
    },
    1 * 60 * 60 * 1000,
  );
}

const stopCheckForUpdates = () => {
  if (checkForUpdatesInterval) {
    clearInterval(checkForUpdatesInterval);
    checkForUpdatesInterval = null;
  }
};

export { autoUpdater, setupAutoUpdater, stopCheckForUpdates };
