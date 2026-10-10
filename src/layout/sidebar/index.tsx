import { useNavigate } from "react-router";

import {
  RiAddLine,
  RiAlbumLine,
  RiDownload2Line,
  RiFolderMusicLine,
  RiHeart3Line,
  RiListCheck2,
  RiMusic2Line,
  RiSettings3Line,
  RiTimeLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import clx from "classnames";

import { PRIMARY_NAV_ITEMS } from "@/layout/route-shell";
import { useSettings } from "@/store/settings";

import ProfileMenu from "./profile-menu";

interface SidebarProps {
  pathname: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: RemixiconComponentType;
}

/**
 * 一级入口的图标。一级入口本身（标签与地址）的唯一真源是
 * `route-shell.ts` 的 `PRIMARY_NAV_ITEMS`，这里只补呈现层需要的图标。
 * `tests/app-shell-interactions.test.ts` 会断言两者同源、且每个入口都有图标。
 */
const NAV_ICONS: Record<string, RemixiconComponentType> = {
  "/": RiMusic2Line,
  "/library": RiHeart3Line,
  "/later": RiTimeLine,
  "/local-music": RiFolderMusicLine,
  "/download-list": RiDownload2Line,
};

const PRIMARY: NavItem[] = PRIMARY_NAV_ITEMS.map(item => ({
  ...item,
  icon: NAV_ICONS[item.href] ?? RiMusic2Line,
}));

const SECONDARY: NavItem[] = [
  { label: "播放队列", href: "/queue", icon: RiListCheck2 },
  { label: "观看历史", href: "/history", icon: RiAlbumLine },
  { label: "关注与动态", href: "/follow", icon: RiHeart3Line },
  { label: "设置", href: "/settings", icon: RiSettings3Line },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" || pathname === "/search" : pathname === href || pathname.startsWith(`${href}/`);

const Sidebar = ({ pathname }: SidebarProps) => {
  const navigate = useNavigate();
  const collapsed = useSettings(state => state.sideMenuCollapsed);
  const updateSettings = useSettings(state => state.update);

  const renderItem = ({ label, href, icon: Icon }: NavItem) => (
    <button
      key={href}
      type="button"
      className={clx("shell4188-nav-item", isActive(pathname, href) && "is-active")}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={() => navigate(href)}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className={clx("shell4188-sidebar", collapsed && "is-collapsed")} aria-label="主导航">
      <button
        type="button"
        className="shell4188-brand"
        aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        onClick={() => updateSettings({ sideMenuCollapsed: !collapsed })}
      >
        lili
      </button>
      <div className="shell4188-sidebar-scroll">
        <nav className="shell4188-nav-list">{PRIMARY.map(renderItem)}</nav>
        <div className="shell4188-sidebar-rule" />
        <div className="shell4188-sidebar-label">
          <span>内容与应用</span>
          <button type="button" aria-label="管理播放列表" onClick={() => navigate("/library")}>
            <RiAddLine size={18} />
          </button>
        </div>
        <nav className="shell4188-nav-list shell4188-nav-secondary">{SECONDARY.map(renderItem)}</nav>
      </div>
      <ProfileMenu />
    </aside>
  );
};

export default Sidebar;
