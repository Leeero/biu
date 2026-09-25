import {
  RiDiscLine,
  RiDiscFill,
  RiFileDownloadLine,
  RiFileDownloadFill,
  RiCalendarScheduleLine,
  RiCalendarScheduleFill,
  RiFolderMusicLine,
  RiFolderMusicFill,
  RiHeart3Line,
  RiHeart3Fill,
} from "@remixicon/react";

import { type MenuItemProps } from "@/components/menu/menu-item";

/**
 * 一级导航。
 *
 * 决策 3 移除侧栏后，这张表从「侧栏菜单项」变成「头像菜单的导航组」——
 * 名字保留 `DefaultMenuList` 是因为设置页的「系统默认菜单」编辑器
 * （`pages/settings/menu-settings.tsx`）按这个形状读写 `hiddenMenuKeys`，
 * 改名会让一个不相关的功能跟着改动。形状不变，语义已变。
 *
 * `needLogin` 表示未登录时不展示；`hiddenMenuKeys` 里出现该 href 时同样不展示。
 * 过滤逻辑见 `layout/topbar/avatar-menu.tsx`。
 */
export const DefaultMenuList: (MenuItemProps & { needLogin?: boolean })[] = [
  {
    title: "发现音乐",
    href: "/",
    icon: RiDiscLine,
    activeIcon: RiDiscFill,
  },
  {
    title: "我的音乐库",
    href: "/library",
    needLogin: true,
    icon: RiHeart3Line,
    activeIcon: RiHeart3Fill,
  },
  {
    title: "稍后播放",
    href: "/later",
    needLogin: true,
    icon: RiCalendarScheduleLine,
    activeIcon: RiCalendarScheduleFill,
  },
  {
    title: "本地音乐",
    href: "/local-music",
    icon: RiFolderMusicLine,
    activeIcon: RiFolderMusicFill,
  },
  {
    title: "下载管理",
    href: "/download-list",
    icon: RiFileDownloadLine,
    activeIcon: RiFileDownloadFill,
  },
];
