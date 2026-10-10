import React, { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router";

import log from "electron-log/renderer";

import { AppShell } from "@/app/shell";
import ConfirmModal from "@/components/confirm-modal";
import ContentFallback from "@/components/error-fallback/content";
import FavoritesSelectModal from "@/components/favorites-select-modal";
import ReleaseNoteModal from "@/components/release-note-modal";
import VideoPagesDownloadSelectModal from "@/components/video-pages-download-select-modal";
import Login from "@/layout/login";
import MobileNav from "@/layout/mobile-nav";
import PlayBar from "@/layout/playbar";
import QueueDrawer from "@/layout/queue-drawer";
import { composeLocalMusicSegments, composeSegmentCount, resolveRouteShell } from "@/layout/route-shell";
import Sidebar from "@/layout/sidebar";
import TopBar from "@/layout/topbar";
import SegmentNav from "@/layout/topbar/segment-nav";
import { useLoginModal } from "@/store/login-modal";
import { usePlayList } from "@/store/play-list";
import { useQueueDrawer } from "@/store/queue-drawer";
import { useSearchSegments } from "@/store/search-segments";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

/**
 * 全局登录弹窗宿主。
 *
 * 弹窗挂在这一层而不是账户菜单内部：门禁按钮（`/library`、`/follow`、`/history`）
 * 与账户菜单的「登录」项共用 `useLoginModal`，两边打开的是同一个弹窗。
 */
const LoginHost = () => {
  const open = useLoginModal(state => state.open);
  const setOpen = useLoginModal(state => state.setOpen);

  return <Login isOpen={open} onOpenChange={setOpen} />;
};

/**
 * 应用外层。
 *
 * 三件事，且只有三件事：
 *   1. 把当前路径翻译成壳层契约（`chrome` + 页面内二级导航 + 激活项），交给 `AppShell`。
 *      壳层状态是**受控**的——`/now-playing` 隐藏两栏、`/mini-player` 整窗接管，
 *      都由 `route-shell.ts` 决定，`AppShell` 自己不猜。`search` 只参与分段组的
 *      激活判定（`/collection/:id` 的三段靠 `?type=` 区分），不影响其余契约。
 *   2. 托住全局弹层（收藏夹选择、确认框、发布说明、下载选择、登录）。
 *      它们不属于任何单个页面，也不属于壳层。
 *   3. 页面级错误边界按路径重置，避免一个页面的渲染错误把整个应用钉死。
 *      它**只包住 `<Outlet />`**：壳层与全局弹层在边界之外，页面挂掉时用户
 *      仍有导航与登录可用。整页兜底属于应用级边界，见 `app.tsx`。
 *
 * 一级导航落在侧栏（`layout/sidebar`，数据源是 `route-shell.ts` 的
 * `PRIMARY_NAV_ITEMS`），账户入口在侧栏底部的账户卡；顶栏只有返回 / 前进 / 搜索，
 * 壳层不持有第二份导航声明。
 */
const Layout = () => {
  const updateUser = useUser(state => state.updateUser);
  const initPlayer = usePlayList(state => state.init);
  const location = useLocation();
  const {
    chrome,
    contextSegments: declaredContextSegments,
    activeContextKey,
    topbarNote,
  } = resolveRouteShell(location.pathname, location.search);
  const { videoCount, creatorCount } = useSearchSegments();
  const localMusicDirs = useSettings(state => state.localMusicDirs);
  const queueOpen = useQueueDrawer(state => state.open);
  const pageOwnsContextNavigation =
    location.pathname === "/search" ||
    location.pathname === "/follow" ||
    location.pathname === "/settings" ||
    location.pathname.startsWith("/user/");

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

  useEffect(() => {
    useQueueDrawer.getState().setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <AppShell
        chrome={chrome}
        sidebar={<Sidebar pathname={location.pathname} />}
        topbar={<TopBar note={topbarNote} />}
        player={<PlayBar />}
        queueDrawer={<QueueDrawer />}
        mobileNav={<MobileNav pathname={location.pathname} />}
        queueOpen={queueOpen}
      >
        <div className="flex h-full min-h-0 flex-col">
          {contextSegments.length > 0 && !pageOwnsContextNavigation && (
            <div className="mb-4 flex h-10 flex-none items-center" aria-label="页面内导航">
              <SegmentNav segments={contextSegments} activeKey={activeContextKey} />
            </div>
          )}
          <div className="min-h-0 flex-1">
            {/*
              页面级错误边界：**只**包住路由内容。
              侧栏 / 顶栏 / 播放栏 / 分段导航与全局弹层（含登录宿主）都在边界外 ——
              页面（尤其是懒加载 chunk）出错时壳层必须活着，否则用户既没有出口、
              也点不到登录。整页兜底 `Fallback` 留给应用级边界（`app.tsx`）。
              `resetKeys` 取 pathname：换页即复位，避免一个页面的错误钉死后续所有页面。
            */}
            <ErrorBoundary
              FallbackComponent={ContentFallback}
              resetKeys={[location.pathname]}
              onError={(error, info) => {
                log.error("[ErrorBoundary]", error, info);
              }}
            >
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </AppShell>
      <FavoritesSelectModal />
      <ConfirmModal />
      <VideoPagesDownloadSelectModal />
      <ReleaseNoteModal />
      <LoginHost />
    </>
  );
};

export default Layout;
