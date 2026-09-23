import { globalShortcut } from "electron";

import type { IpcHandlerProps } from "./types";

import { parseShortcutCommand, parseShortcutRegistration } from "../security/validation";
import { registerAllShortcuts, unregisterAllShortcuts } from "../shortcut";
import { shortcutKeyStore } from "../store";
import { channel } from "./channel";

export function registerShortcutHandlers({ getMainWindow }: IpcHandlerProps) {
  handleTrustedIpc(channel.shortcut.register, (_, payload) => {
    try {
      const { accelerator, id } = parseShortcutRegistration(payload);
      const globalShortcuts = shortcutKeyStore.get("globalShortcuts");
      const oldShortcut = globalShortcuts.find(s => s.id === id)?.shortcut;

      if (oldShortcut) {
        globalShortcut.unregister(oldShortcut);
      }

      const handleAction = () => {
        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send(channel.shortcut.triggered, id);
        }
      };

      const registerSuccess = globalShortcut.register(accelerator, handleAction);
      return registerSuccess;
    } catch {
      return false;
    }
  });

  // 注销指定快捷键
  handleTrustedIpc(channel.shortcut.unregister, (_, id) => {
    id = parseShortcutCommand(id);
    const globalShortcuts = shortcutKeyStore.get("globalShortcuts");
    const shortcut = globalShortcuts.find(s => s.id === id)?.shortcut;
    if (shortcut) {
      globalShortcut.unregister(shortcut);
    }
  });

  handleTrustedIpc(channel.shortcut.unregisterAll, () => {
    unregisterAllShortcuts();
  });

  handleTrustedIpc(channel.shortcut.registerAll, () => {
    registerAllShortcuts(getMainWindow);
  });
}
import { handleTrustedIpc } from "../security/ipc";
