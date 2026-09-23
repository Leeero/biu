import log from "electron-log";

import { StoreNameMap } from "@shared/store";

import { parseStoreName, parseStoreValue } from "../security/validation";
import { appSettingsStore, lyricsCacheStore, shortcutKeyStore, userStore } from "../store";
import { channel } from "./channel";

export function registerStoreHandlers() {
  handleTrustedIpc(channel.store.get, async (_, name: StoreName) => {
    name = parseStoreName(name);
    if (name === StoreNameMap.AppSettings) {
      return appSettingsStore.store;
    }

    if (name === StoreNameMap.UserLoginInfo) {
      return userStore.store;
    }

    if (name === StoreNameMap.ShortcutSettings) {
      return shortcutKeyStore.store;
    }

    if (name === StoreNameMap.LyricsCache) {
      return lyricsCacheStore.store;
    }
  });

  handleTrustedIpc(channel.store.set, async (_, name: StoreName, value: any) => {
    try {
      name = parseStoreName(name);
      value = parseStoreValue(value);

      if (name === StoreNameMap.AppSettings) {
        appSettingsStore.set(value);
      }

      if (name === StoreNameMap.UserLoginInfo) {
        userStore.set(value);
      }

      if (name === StoreNameMap.ShortcutSettings) {
        shortcutKeyStore.set(value);
      }

      if (name === StoreNameMap.LyricsCache) {
        lyricsCacheStore.set(value);
      }
    } catch (err) {
      log.error(`[store:set] Error setting store ${String(name)}:`, err);
    }
  });

  handleTrustedIpc(channel.store.clear, async (_, name: StoreName) => {
    name = parseStoreName(name);
    if (name === StoreNameMap.AppSettings) {
      appSettingsStore.clear();
    }

    if (name === StoreNameMap.UserLoginInfo) {
      userStore.clear();
    }

    if (name === StoreNameMap.ShortcutSettings) {
      shortcutKeyStore.clear();
    }

    if (name === StoreNameMap.LyricsCache) {
      lyricsCacheStore.clear();
    }

    return true;
  });
}
import { handleTrustedIpc } from "../security/ipc";
