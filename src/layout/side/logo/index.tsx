import { useEffect, useState } from "react";

import { twMerge } from "tailwind-merge";

import { ReactComponent as LogoIcon } from "@/assets/icons/logo.svg";

const isMac = window.electron?.getPlatform() === "macos";

interface LogoProps {
  isCollapsed: boolean;
}

const Logo = ({ isCollapsed }: LogoProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!isMac) return;

    window.electron?.isFullScreen().then(setIsFullScreen);
    const unlisten = window.electron?.onWindowFullScreenChange(setIsFullScreen);

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <>
      <div
        className={twMerge(
          "window-drag text-primary relative flex h-[var(--biu-topbar-height)] flex-none items-center px-4",
          isMac && !isFullScreen && "pt-8",
        )}
      >
        <div className="window-no-drag flex flex-1 items-center gap-2.5">
          <LogoIcon className="h-8 w-8 flex-none" />
          {!isCollapsed && <span className="text-xl leading-none font-bold tracking-[-0.02em]">Biu</span>}
        </div>
      </div>
    </>
  );
};

export default Logo;
