import { useState } from "react";

import clx from "classnames";

import type { TopbarSegment } from "@/layout/route-shell";

import WindowAction from "@/components/window-action";

import AppUpdateNotify from "./app-update";
import AvatarMenu from "./avatar-menu";
import Brand from "./brand";
import Dev from "./dev";
import SearchField from "./search-field";
import SegmentNav from "./segment-nav";

const platform = window.electron.getPlatform();

interface TopBarProps {
  /** 分段组，由路由契约给出（见 `@/layout/route-shell`）。 */
  segments: TopbarSegment[];
  /** 当前激活分段的 key。分段组回落到一级导航且都不匹配时是空串。 */
  activeSegmentKey: string;
  /**
   * 分段组右侧的弱化说明（`globalChrome.topbarNote`），由路由契约给出。
   * 未登记的路由没有它 —— 传 `undefined` 即不渲染。
   */
  note?: string;
}

/**
 * 顶栏。
 *
 * 几何取自设计稿实测：高由壳层给（71），左右内边距 34 / 22，品牌与分段组间距 38，
 * 右侧一簇靠 `ml-auto` 推到最右，间距 40。背景与模糊在壳层（AppShell）上，
 * 这里只负责排布，避免两处都写背景导致覆盖顺序难推理。
 *
 * `window-drag` 的处理沿用上一轮：整条顶栏可拖动窗口，但搜索框与头像菜单
 * 展开时必须切到 `window-no-drag`，否则点不到——这是 Electron 桌面端的硬约束，
 * 与视觉无关。Linux / Windows 额外挂窗口控制按钮（macOS 用系统红绿灯，不重复渲染）。
 */
const TopBar = ({ segments, activeSegmentKey, note }: TopBarProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isNoDrag = isSearchFocused || isUserDropdownOpen;

  return (
    <div
      className={clx("flex h-full items-center gap-[38px] pr-[22px] pl-[34px]", {
        "window-drag": !isNoDrag,
        "window-no-drag": isNoDrag,
      })}
    >
      <Brand />
      <SegmentNav segments={segments} activeKey={activeSegmentKey} note={note} />

      <div className="window-no-drag ml-auto flex flex-none items-center gap-10">
        <SearchField onFocusChange={setIsSearchFocused} />
        <AppUpdateNotify />
        <Dev />
        <AvatarMenu onDropdownOpenChange={setIsUserDropdownOpen} />
        {["linux", "windows"].includes(platform) && <WindowAction />}
      </div>
    </div>
  );
};

export default TopBar;
