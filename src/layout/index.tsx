import React, { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router";

import log from "electron-log/renderer";

import { AppShell } from "@/app/shell";
import ConfirmModal from "@/components/confirm-modal";
import Fallback from "@/components/error-fallback";
import FavoritesSelectModal from "@/components/favorites-select-modal";
import ReleaseNoteModal from "@/components/release-note-modal";
import VideoPagesDownloadSelectModal from "@/components/video-pages-download-select-modal";
import PlayBar from "@/layout/playbar";
import { composeLocalMusicSegments, composeSegmentCount, resolveRouteShell } from "@/layout/route-shell";
import TopBar from "@/layout/topbar";
import SegmentNav from "@/layout/topbar/segment-nav";
import { usePlayList } from "@/store/play-list";
import { useSearchSegments } from "@/store/search-segments";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

/**
 * 应用外层。
 *
 * 三件事，且只有三件事：
 *   1. 把当前路径翻译成壳层契约（`chrome` + 顶栏分段 + 激活分段），交给 `AppShell`。
 *      壳层状态是**受控**的——`/now-playing` 隐藏两栏、`/mini-player` 整窗接管，
 *      都由 `route-shell.ts` 决定，`AppShell` 自己不猜。`search` 只参与分段组的
 *      激活判定（`/collection/:id` 的三段靠 `?type=` 区分），不影响其余契约。
 *   2. 托住全局弹层（收藏夹选择、确认框、发布说明、下载选择）。
 *      它们不属于任何单个页面，也不属于壳层。
 *   3. 错误边界按路径重置，避免一个页面的渲染错误把整个应用钉死。
 *
 * 侧栏（`layout/side`）已在决策 3 中移除；一级导航改由顶栏分段组与头像菜单承载。
 */
const Layout = () => {
  const updateUser = useUser(state => state.updateUser);
  const initPlayer = usePlayList(state => state.init);
  const location = useLocation();
  const {
    chrome,
    segments,
    activeSegmentKey,
    contextSegments: declaredContextSegments,
    activeContextKey,
    topbarNote,
  } = resolveRouteShell(location.pathname, location.search);
  const { videoCount, creatorCount } = useSearchSegments();
  const localMusicDirs = useSettings(state => state.localMusicDirs);

  /**
   * 模板分段与运行时计数的组合点（spec-lock `topbarSegments.labelSources`）。
   * 纯函数 `composeSegmentCount` 在 route-shell.ts，可被单测直接断言。
   */
  const contextSegments = useMemo(() => {
    const counted = declaredContextSegments.map(segment => composeSegmentCount(segment, { videoCount, creatorCount }));
    if (location.pathname !== "/local-music") return counted;
    return composeLocalMusicSegments(counted, localMusicDirs, new URLSearchParams(location.search).has("fixture"));
  }, [creatorCount, declaredContextSegments, localMusicDirs, location.pathname, location.search, videoCount]);

  useEffect(() => {
    updateUser();
  }, [updateUser]);

  // 播放器生命周期属于应用，而不是底栏。沉浸页会隐藏底栏，如果在 PlayBar
  // 挂载时初始化，返回普通页面就会再次读取持久化进度并覆盖当前播放位置。
  useEffect(() => {
    void initPlayer();
  }, [initPlayer]);

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
        topbar={<TopBar segments={segments} activeSegmentKey={activeSegmentKey} note={topbarNote} />}
        player={<PlayBar />}
      >
        <div className="flex h-full min-h-0 flex-col">
          {contextSegments.length > 0 && (
            <div className="mb-4 flex h-10 flex-none items-center" aria-label="页面内导航">
              <SegmentNav segments={contextSegments} activeKey={activeContextKey} />
            </div>
          )}
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </AppShell>
      <FavoritesSelectModal />
      <ConfirmModal />
      <VideoPagesDownloadSelectModal />
      <ReleaseNoteModal />
    </ErrorBoundary>
  );
};

export default Layout;
