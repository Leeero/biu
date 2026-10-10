import { logger } from "@rsbuild/core";
import { build as electronBuild } from "electron-builder";

import pkg from "../package.json";
import { ELECTRON_OUT_DIRNAME, ELECTRON_ICON_BASE_PATH } from "../shared/path";

export async function buildElectron() {
  await electronBuild({
    publish: "onTag",
    config: {
      appId: "com.leeero.lili",
      productName: "lili",
      // 该字段会落到 macOS 关于面板的 NSHumanReadableCopyright（用户直接可见）。带上上游署名
      // 不是许可证强制项（强制项是随包 NOTICE 里那行 `Required Notice`），而是二开版主动标明来源。
      copyright: `Copyright © ${new Date().getFullYear()} Leeero · 基于 wood3n/biu (© 2022–2025 wood3n)`,
      nodeVersion: "current",
      buildVersion: pkg.version,
      asar: true,
      electronCompile: false,
      compression: "maximum",
      removePackageScripts: true,
      removePackageKeywords: true,
      npmRebuild: false,
      nodeGypRebuild: false,
      buildDependenciesFromSource: false,
      electronLanguages: ["zh-CN"],
      directories: {
        output: "dist/artifacts",
      },
      extraResources: [
        { from: ELECTRON_ICON_BASE_PATH, to: ELECTRON_ICON_BASE_PATH },
        // PolyForm Noncommercial 1.0.0 的 `Notices` 条款：拿到软件副本的人，必须同时拿到
        // 许可证条款（或其 URL）与 `Required Notice:` 开头的原文。分发的 dmg/zip/安装包
        // 就是「软件副本」，所以这两份文件必须随包发出 —— 只放在仓库里不算履行。
        { from: "LICENSE", to: "LICENSE" },
        { from: "NOTICE", to: "NOTICE" },
      ],
      files: [`${ELECTRON_OUT_DIRNAME}/**`, "dist/web/**"],
      win: {
        target: [
          { target: "nsis", arch: ["x64", "arm64"] },
          { target: "portable", arch: ["x64", "arm64"] },
        ],
        icon: `${ELECTRON_ICON_BASE_PATH}/logo.ico`,
        extraResources: [{ from: "electron/ffmpeg/ffmpeg.exe", to: "electron/ffmpeg/ffmpeg.exe" }],
      },
      nsis: {
        deleteAppDataOnUninstall: true,
        oneClick: false,
        perMachine: false,
        allowElevation: true,
        allowToChangeInstallationDirectory: true,
        buildUniversalInstaller: false,
        artifactName: "${productName}-${version}-win-setup-${arch}.${ext}",
      },
      portable: {
        artifactName: "${productName}-${version}-win-portable-${arch}.${ext}",
      },
      mac: {
        target: [
          { target: "dmg", arch: ["x64", "arm64"] },
          { target: "zip", arch: ["x64", "arm64"] },
        ],
        category: "public.app-category.music",
        icon: `${ELECTRON_ICON_BASE_PATH}/lili.icon`,
        hardenedRuntime: true,
        gatekeeperAssess: false,
        darkModeSupport: true,
        entitlements: "plugins/mac/entitlements.mac.plist",
        entitlementsInherit: "plugins/mac/entitlements.mac.plist",
        notarize: false,
        artifactName: "${productName}-${version}-mac-${arch}.${ext}",
        extraResources: [{ from: "electron/ffmpeg/ffmpeg-mac-${arch}", to: "electron/ffmpeg/ffmpeg-mac-${arch}" }],
      },
      linux: {
        target: [
          { target: "AppImage", arch: ["x64", "arm64"] },
          { target: "deb", arch: ["x64", "arm64"] },
          { target: "rpm", arch: ["x64", "arm64"] },
        ],
        icon: `${ELECTRON_ICON_BASE_PATH}/logo.png`,
        category: "AudioVideo",
        synopsis: "lili - bilibili music desktop application",
        maintainer: "Leeero",
        vendor: "Leeero",
        executableName: "lili",
        artifactName: "${productName}-${version}-linux-${arch}.${ext}",
        extraResources: [{ from: "electron/ffmpeg/ffmpeg-linux", to: "electron/ffmpeg/ffmpeg-linux" }],
      },
      publish: {
        provider: "github",
        owner: "Leeero",
        repo: "lili",
        releaseType: null,
      },
    },
  })
    .then(result => {
      logger.success(result);
    })
    .catch(error => {
      logger.error(error);
      throw error;
    });
}
