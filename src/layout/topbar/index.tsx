import { useState } from "react";
import { useNavigate } from "react-router";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import clx from "classnames";

import type { TopbarSegment } from "@/layout/route-shell";

import WindowAction from "@/components/window-action";

import AppUpdateNotify from "./app-update";
import AvatarMenu from "./avatar-menu";
import SearchField from "./search-field";

const platform = window.electron.getPlatform();

interface TopBarProps {
  segments: TopbarSegment[];
  activeSegmentKey: string;
  note?: string;
}

/** 4188 顶栏：历史导航、居中全局搜索、账户与窗口操作。页面分段下沉到内容区。 */
const TopBar = ({ segments, activeSegmentKey, note }: TopBarProps) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const noDrag = isSearchFocused || isUserDropdownOpen;

  return (
    <div
      className={clx("shell4188-topbar-inner", noDrag ? "window-no-drag" : "window-drag")}
      data-active-segment={activeSegmentKey}
      data-segment-count={segments.length}
      data-note={note}
    >
      <div className="shell4188-history window-no-drag">
        <button type="button" aria-label="返回上一页" onClick={() => navigate(-1)}>
          <RiArrowLeftSLine size={23} />
        </button>
        <button type="button" aria-label="前进下一页" onClick={() => navigate(1)}>
          <RiArrowRightSLine size={23} />
        </button>
      </div>
      <SearchField onFocusChange={setIsSearchFocused} className="shell4188-search window-no-drag" />
      <div className="shell4188-topbar-actions window-no-drag">
        <AppUpdateNotify />
        <AvatarMenu onDropdownOpenChange={setIsUserDropdownOpen} />
        {["linux", "windows"].includes(platform) && <WindowAction />}
      </div>
    </div>
  );
};

export default TopBar;
