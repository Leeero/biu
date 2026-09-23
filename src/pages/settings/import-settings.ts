import { merge } from "es-toolkit/object";

import { defaultAppSettings } from "@shared/settings/app-settings";

/** 只接受已知且实际存在的设置字段，兼容旧版本导出的不完整配置。 */
export const mergeImportedSettings = (current: AppSettings, imported: unknown): AppSettings => {
  if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
    throw new Error("invalid settings");
  }

  const source = imported as Record<string, unknown>;
  const patch = Object.keys(defaultAppSettings).reduce<Record<string, unknown>>((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      result[key] = source[key];
    }
    return result;
  }, {});

  return merge(current, patch) as AppSettings;
};
