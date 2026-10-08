import { useNavigate } from "react-router";

import {
  RiAddLine,
  RiAlbumLine,
  RiArrowRightSLine,
  RiDownload2Line,
  RiFolderMusicLine,
  RiHeart3Line,
  RiListCheck2,
  RiMusic2Line,
  RiSettings3Line,
  RiTimeLine,
} from "@remixicon/react";
import clx from "classnames";

import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

interface SidebarProps {
  pathname: string;
}

const PRIMARY = [
  { label: "发现音乐", href: "/", icon: RiMusic2Line },
  { label: "我的音乐", href: "/library", icon: RiHeart3Line },
  { label: "稍后播放", href: "/later", icon: RiTimeLine },
  { label: "本地音乐", href: "/local-music", icon: RiFolderMusicLine },
  { label: "下载管理", href: "/download-list", icon: RiDownload2Line },
] as const;

const SECONDARY = [
  { label: "播放队列", href: "/queue", icon: RiListCheck2 },
  { label: "观看历史", href: "/history", icon: RiAlbumLine },
  { label: "关注与动态", href: "/follow", icon: RiHeart3Line },
  { label: "设置", href: "/settings", icon: RiSettings3Line },
] as const;

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" || pathname === "/search" : pathname === href || pathname.startsWith(`${href}/`);

const Sidebar = ({ pathname }: SidebarProps) => {
  const navigate = useNavigate();
  const collapsed = useSettings(state => state.sideMenuCollapsed);
  const updateSettings = useSettings(state => state.update);
  const user = useUser(state => state.user);

  const renderItem = ({ label, href, icon: Icon }: (typeof PRIMARY)[number] | (typeof SECONDARY)[number]) => (
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
        Biu
      </button>
      <nav className="shell4188-nav-list">{PRIMARY.map(renderItem)}</nav>
      <div className="shell4188-sidebar-rule" />
      <div className="shell4188-sidebar-label">
        <span>内容与应用</span>
        <button type="button" aria-label="管理播放列表" onClick={() => navigate("/library")}>
          <RiAddLine size={18} />
        </button>
      </div>
      <nav className="shell4188-nav-list shell4188-nav-secondary">{SECONDARY.map(renderItem)}</nav>
      <button
        type="button"
        className="shell4188-profile"
        onClick={() => navigate(user?.isLogin ? `/user/${user.mid}` : "/settings")}
      >
        {user?.face ? <img src={user.face} alt="" /> : <span className="shell4188-avatar-fallback">B</span>}
        <span className="shell4188-profile-copy">
          <strong>{user?.isLogin ? user.uname : "未登录"}</strong>
          <small>{user?.isLogin ? "Bilibili 账户" : "登录后同步内容"}</small>
        </span>
        <RiArrowRightSLine size={20} />
      </button>
    </aside>
  );
};

export default Sidebar;
