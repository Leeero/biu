import type { ReactNode } from "react";

import clx from "classnames";

import { resolveShellLayout, type ShellChrome } from "./model";

import "./shell-4188.css";

interface AppShellProps {
  chrome?: ShellChrome;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  player?: ReactNode;
  queueDrawer?: ReactNode;
  mobileNav?: ReactNode;
  queueOpen?: boolean;
  children: ReactNode;
}

export const AppShell = ({
  chrome = "default",
  sidebar,
  topbar,
  player,
  queueDrawer,
  mobileNav,
  queueOpen = false,
  children,
}: AppShellProps) => {
  const layout = resolveShellLayout(chrome);
  const immersive = chrome === "immersive";

  return (
    <div className={clx("shell4188", queueOpen && !immersive && "is-queue-open", immersive && "is-immersive")}>
      <a href="#main-content" className="shell4188-skip-link">
        跳转到主要内容
      </a>
      {!immersive && sidebar}
      {layout.hasTopbar && <header className="shell4188-topbar">{topbar}</header>}
      <main id="main-content" tabIndex={-1} className="shell4188-content">
        <div className={clx("shell4188-content-inner", !layout.contentInset && "is-full-bleed")}>{children}</div>
      </main>
      {queueOpen && !immersive && queueDrawer}
      {layout.hasPlayer && (
        <section aria-label="播放器" className="shell4188-player">
          {player}
        </section>
      )}
      {!immersive && mobileNav}
    </div>
  );
};
