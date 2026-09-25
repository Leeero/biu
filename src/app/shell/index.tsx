import type { ReactNode } from "react";

import clx from "classnames";

import { resolveShellLayout, type ShellChrome } from "./model";

interface AppShellProps {
  /** 壳层状态，由路由契约决定（见 route-shell.ts），不在组件内部推断。 */
  chrome?: ShellChrome;
  topbar?: ReactNode;
  player?: ReactNode;
  children: ReactNode;
}

/**
 * 三处复合背景为什么用工具类而不是 arbitrary value：
 * `--biu-app-bg` / `--biu-topbar-bg` / `--biu-immersive-bg` 都是 **background 简写**
 * （两层渐变 + 底色）。Tailwind 的 `bg-[...]` 会被判定成 background-image，
 * 而简写里最后那个底色层不是合法 image，整条声明会被浏览器丢弃——
 * 结果就是「颜色没了但不报错」。所以这三处统一走 app.css 里定义的 @utility。
 */
const BACKGROUND_CLASS = {
  app: "stage-bg",
  immersive: "stage-bg-immersive",
  none: "",
} as const;

/**
 * 应用的稳定视觉骨架：顶栏 / 内容 / 播放栏三层。
 *
 * 这里只组织区域，不承载导航、播放或账户业务状态。侧栏插槽已随决策 3 移除。
 *
 * 播放区刻意用 `<section aria-label>`（映射为 `region`）而不是 `<footer>`：
 * `<footer>` 作为页面直系子节点会被映射成 `contentinfo`（站点级版权/联系信息），
 * 拿它装播放器语义不符，也会让依赖该地标的辅助技术预期落空。
 */
export const AppShell = ({ chrome = "default", topbar, player, children }: AppShellProps) => {
  const layout = resolveShellLayout(chrome);

  return (
    <div
      className={clx(
        "relative flex h-full min-w-[1200px] flex-col text-[rgb(var(--biu-text-primary))]",
        BACKGROUND_CLASS[layout.background],
      )}
    >
      <a
        href="#main-content"
        className="absolute top-2 left-2 z-[100] -translate-y-16 rounded-[var(--biu-radius-md)] bg-[var(--biu-surface-raised)] px-3 py-2 text-sm shadow-[var(--biu-shadow-floating)] transition-transform focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-[var(--biu-color-focus)] focus-visible:outline-none"
      >
        跳转到主要内容
      </a>

      {layout.hasTopbar && (
        <header className="topbar-bg relative z-[var(--biu-z-topbar)] h-[var(--biu-layout-topbar-h)] flex-none backdrop-blur-[var(--biu-blur-glass)]">
          {topbar}
        </header>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className={clx(
          "relative z-[var(--biu-z-content)] min-h-0 flex-1 overflow-hidden",
          layout.contentInset && "px-[var(--biu-layout-gutter)] pt-[var(--biu-layout-content-pt)]",
        )}
      >
        {children}
      </main>

      {layout.hasPlayer && (
        <section
          aria-label="播放器"
          className="playbar-bg relative z-[var(--biu-z-player)] h-[var(--biu-layout-player-h)] w-full flex-none border-t border-[var(--biu-border-weak)] backdrop-blur-[var(--biu-blur-glass)]"
        >
          {player}
        </section>
      )}
    </div>
  );
};
