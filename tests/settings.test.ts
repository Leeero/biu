import { beforeEach, describe, expect, test, vi } from "vitest";

import { mergeImportedSettings } from "@/pages/settings/import-settings";
import { defaultAppSettings } from "@shared/settings/app-settings";
import { StoreNameMap } from "@shared/store";

const createElectronStore = (appSettings?: Partial<AppSettings>) => ({
  getStore: vi.fn(async () => (appSettings ? { appSettings } : undefined)),
  setStore: vi.fn(async () => undefined),
  clearStore: vi.fn(async () => undefined),
});

const loadSettingsStore = async (appSettings?: Partial<AppSettings>) => {
  vi.resetModules();
  const electron = createElectronStore(appSettings);
  window.electron = electron as any;
  const { useSettings } = await import("@/store/settings");
  await useSettings.persist.rehydrate();
  return { electron, useSettings };
};

describe("settings store", () => {
  beforeEach(() => {
    window.electron = undefined as any;
  });

  test("uses defaults when no persisted settings exist", async () => {
    const { useSettings } = await loadSettingsStore();
    expect(useSettings.getState().getSettings()).toEqual(defaultAppSettings);
  });

  test("rehydrates persisted settings and migrates the legacy font value", async () => {
    const { useSettings } = await loadSettingsStore({
      ...defaultAppSettings,
      fontFamily: "system-default",
      themeMode: "dark",
    });
    expect(useSettings.getState().fontFamily).toBe("system-ui");
    expect(useSettings.getState().themeMode).toBe("dark");
  });

  test("persists updates through the Electron settings store", async () => {
    const { electron, useSettings } = await loadSettingsStore(defaultAppSettings);
    useSettings.getState().update({ themeMode: "dark", sideMenuWidth: 240 });
    await vi.waitFor(() => expect(electron.setStore).toHaveBeenCalled());
    expect(electron.setStore).toHaveBeenLastCalledWith(
      StoreNameMap.AppSettings,
      expect.objectContaining({
        appSettings: expect.objectContaining({ themeMode: "dark", sideMenuWidth: 240 }),
      }),
    );
  });

  test("reset restores and persists every default setting", async () => {
    const { electron, useSettings } = await loadSettingsStore({
      ...defaultAppSettings,
      primaryColor: "#ff0000",
      sideMenuCollapsed: true,
    });
    useSettings.getState().reset();
    expect(useSettings.getState().getSettings()).toEqual(defaultAppSettings);
    await vi.waitFor(() =>
      expect(electron.setStore).toHaveBeenLastCalledWith(StoreNameMap.AppSettings, {
        appSettings: defaultAppSettings,
      }),
    );
  });
});

describe("settings import", () => {
  test("keeps current values when an older export omits newer fields", () => {
    const current = {
      ...defaultAppSettings,
      localMusicDirs: ["/music"],
      reportPlayHistory: false,
    };

    expect(mergeImportedSettings(current, { themeMode: "dark" })).toMatchObject({
      themeMode: "dark",
      localMusicDirs: ["/music"],
      reportPlayHistory: false,
    });
  });

  test("ignores unknown fields and rejects non-object imports", () => {
    const merged = mergeImportedSettings(defaultAppSettings, { unknownSetting: true });
    expect(merged).toEqual(defaultAppSettings);
    expect(merged).not.toHaveProperty("unknownSetting");
    expect(() => mergeImportedSettings(defaultAppSettings, null)).toThrow();
  });
});
