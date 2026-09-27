import React, { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router";

import log from "electron-log/renderer";

import { AppShell } from "@/app/shell";
import ConfirmModal from "@/components/confirm-modal";
import Fallback from "@/components/error-fallback";
import FavoritesSelectModal from "@/components/favorites-select-modal";
import FullScreenPlayer from "@/components/full-screen-player";
import PlayListDrawer from "@/components/music-playlist-drawer";
import ReleaseNoteModal from "@/components/release-note-modal";
import VideoPagesDownloadSelectModal from "@/components/video-pages-download-select-modal";
import PlayBar from "@/layout/playbar";
import { composeSegmentCount, resolveRouteShell } from "@/layout/route-shell";
import TopBar from "@/layout/topbar";
import { useSearchSegments } from "@/store/search-segments";
import { useUser } from "@/store/user";

/**
 * 应用外层。
 *
 * 三件事，且只有三件事：
 *   1. 把当前路径翻译成壳层契约（`chrome` + 顶栏分段 + 激活分段），交给 `AppShell`。
 *      壳层状态是**受控**的——`/now-playing` 隐藏两栏、`/mini-player` 整窗接管，
 *      都由 `route-shell.ts` 决定，`AppShell` 自己不猜。`search` 只参与分段组的
 *      激活判定（`/collection/:id` 的三段靠 `?type=` 区分），不影响其余契约。
 *   2. 托住全局弹层（收藏夹选择、确认框、发布说明、下载选择、播放列表抽屉、全屏播放器）。
 *      它们不属于任何单个页面，也不属于壳层。
 *   3. 错误边界按路径重置，避免一个页面的渲染错误把整个应用钉死。
 *
 * 侧栏（`layout/side`）已在决策 3 中移除；一级导航改由顶栏分段组与头像菜单承载。
 */
const Layout = () => {
  const updateUser = useUser(state => state.updateUser);
  const location = useLocation();
  const {
    chrome,
    segments: declaredSegments,
    activeSegmentKey,
  } = resolveRouteShell(location.pathname, location.search);
  const { videoCount, creatorCount } = useSearchSegments();

  /**
   * 模板分段与运行时计数的组合点（spec-lock `topbarSegments.labelSources`）。
   * 纯函数 `composeSegmentCount` 在 route-shell.ts，可被单测直接断言。
   */
  const segments = useMemo(
    () => declaredSegments.map(segment => composeSegmentCount(segment, { videoCount, creatorCount })),
    [declaredSegments, videoCount, creatorCount],
  );

  useEffect(() => {
    updateUser();
  }, [updateUser]);

  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      resetKeys={[location.pathname]}
      onError={(error, info) => {
        log.error("[ErrorBoundary]", error, info);
      }}
    >
      <AppShell
        chrome={chrome}
        topbar={<TopBar segments={segments} activeSegmentKey={activeSegmentKey} />}
        player={<PlayBar />}
      >
        <Outlet />
      </AppShell>
      <FavoritesSelectModal />
      <ConfirmModal />
      <VideoPagesDownloadSelectModal />
      <ReleaseNoteModal />
      <PlayListDrawer />
      <FullScreenPlayer />
    </ErrorBoundary>
  );
};

export default Layout;
