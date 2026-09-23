import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  player: ReactNode;
  children: ReactNode;
}

/**
 * 应用的稳定视觉骨架。这里只组织区域，不承载导航、播放或账户业务状态。
 */
export const AppShell = ({ sidebar, topbar, player, children }: AppShellProps) => (
  <div className="relative flex h-full min-w-[1200px] flex-col bg-[rgb(var(--biu-color-canvas))] text-[rgb(var(--biu-color-text-primary))]">
    <a
      href="#main-content"
      className="absolute top-2 left-2 z-[100] -translate-y-16 rounded-[var(--biu-radius-md)] bg-[rgb(var(--biu-color-surface-raised))] px-3 py-2 text-sm shadow-[var(--biu-shadow-floating)] transition-transform focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-[rgb(var(--biu-color-focus))] focus-visible:outline-none"
    >
      跳转到主要内容
    </a>

    <div className="flex min-h-0 w-full flex-1">
      {sidebar}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative z-30 h-[var(--biu-topbar-height)] flex-none border-b border-[rgb(var(--biu-color-border)/0.06)] bg-[rgb(var(--biu-color-canvas)/0.88)] backdrop-blur-xl">
          {topbar}
        </header>
        <main id="main-content" className="min-h-0 flex-1 overflow-hidden" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>

    <section
      aria-label="播放器"
      className="relative z-50 h-[var(--biu-player-height)] w-full flex-none border-t border-[rgb(var(--biu-color-border)/0.08)] bg-[rgb(var(--biu-color-surface)/0.96)] shadow-[0_-12px_32px_rgb(0_0_0/0.06)] backdrop-blur-xl"
    >
      {player}
    </section>
  </div>
);
