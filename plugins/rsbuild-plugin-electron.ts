import { logger, type RsbuildPlugin } from "@rsbuild/core";
import { rimrafSync } from "rimraf";

import { buildElectron } from "./electron-build";
import { buildElectronConfig } from "./electron-config-build";
import { startElectronDev } from "./electron-dev";

export const pluginElectron = (): RsbuildPlugin => ({
  name: "plugin-electron",
  setup(api) {
    // 保真度比对 / CI 网页构建只需要 dist/web，跳过 Electron 主进程打包与
    // electron-builder 封装（后者会跑 dmg/zip 多目标，极慢且与本目标无关）。
    // 用 BIU_WEB_ONLY=1 触发：`BIU_WEB_ONLY=1 pnpm build`。
    const webOnly = process.env.BIU_WEB_ONLY === "1";

    api.onAfterDevCompile(async ({ isFirstCompile }) => {
      if (webOnly) return;
      if (isFirstCompile) {
        logger.info("[electron] Bundle the typescript configuration for electron...");
        await buildElectronConfig("development");

        startElectronDev();
      }
    });

    api.onBeforeBuild(async () => {
      if (webOnly) return;
      logger.info("Cleaning dist directory...");
      try {
        rimrafSync("dist");
      } catch (err) {
        logger.error(`Clean dist failed: ${String((err && (err as any).message) || err)}`);
      }

      logger.info("[electron] Bundling Electron TypeScript...");
      await buildElectronConfig();
    });

    api.onAfterBuild(async () => {
      if (webOnly) return;
      await buildElectron();
    });
  },
});
