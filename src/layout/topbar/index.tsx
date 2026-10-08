import { useState } from "react";
import { useNavigate } from "react-router";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import clx from "classnames";

import WindowAction from "@/components/window-action";

import AppUpdateNotify from "./app-update";
import SearchField from "./search-field";

const platform = window.electron.getPlatform();

interface TopBarProps {
  /** 路由级的弱化说明（`route-shell.ts` 的 `TOPBAR_NOTE_BY_ROUTE`）。 */
  note?: string;
}

/**
 * 4188 顶栏：历史导航、居中全局搜索与窗口操作。
 *
 * 顶栏**不渲染导航**：一级导航由侧栏承接，账户入口由侧栏底部的账户卡承接。
 * 此前这里收过 `segments` / `activeSegmentKey` 却只把它们写成 `data-*` 属性
 * （没有任何消费者），与侧栏的导航表并存成双份事实源，已移除。
 */
const TopBar = ({ note }: TopBarProps) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const noDrag = isSearchFocused;

  return (
    <div className={clx("shell4188-topbar-inner", noDrag ? "window-no-drag" : "window-drag")} data-note={note}>
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
        {["linux", "windows"].includes(platform) && <WindowAction />}
      </div>
    </div>
  );
};

export default TopBar;
