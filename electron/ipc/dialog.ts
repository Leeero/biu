import { shell, dialog } from "electron";
import log from "electron-log";
import fs from "node:fs";
import path from "node:path";

import { parseAbsolutePath, parseExternalUrl, parseOptionalDialogTitle } from "../security/validation";
import { appSettingsStore } from "../store";
import { channel } from "./channel";

export function registerDialogHandlers() {
  handleTrustedIpc(channel.dialog.openDirectory, async (_event, dir?: string) => {
    const targetDir = parseAbsolutePath(
      dir ?? appSettingsStore.get("appSettings")?.downloadPath ?? path.resolve(process.cwd(), "downloads"),
    );
    const err = await shell.openPath(targetDir);
    return err === "";
  });

  handleTrustedIpc(channel.dialog.showFileInFolder, (_event, filePath: string) => {
    const targetPath = parseAbsolutePath(filePath);
    if (!fs.existsSync(targetPath)) {
      throw new Error("文件路径不存在");
    }
    shell.showItemInFolder(targetPath);
    return true;
  });

  handleTrustedIpc(channel.dialog.openExternal, async (_event, url: string) => {
    try {
      await shell.openExternal(parseExternalUrl(url));
      return true;
    } catch (err) {
      // 修改说明：外部链接打开失败时记录错误并返回失败
      log.error("[dialog] openExternal failed:", err);
      return false;
    }
  });

  handleTrustedIpc(channel.dialog.selectDirectory, async (_event, title?: string) => {
    const resolvedTitle = parseOptionalDialogTitle(title) ?? "选择目录";
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: resolvedTitle,
    });
    if (result.canceled) return null;
    const dir = result.filePaths?.[0] ?? null;
    return dir;
  });

  handleTrustedIpc(channel.dialog.selectFile, async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      title: "选择文件",
    });
    if (result.canceled) return null;
    return result.filePaths?.[0] ?? null;
  });
}
import { handleTrustedIpc } from "../security/ipc";
