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
 * 这张表仍是设置页「系统默认菜单」编辑器的数据源；实际的常驻一级导航契约
 * 由 `layout/route-shell.ts` 提供。名字与形状暂时保留，避免菜单显隐设置迁移时
 * 破坏已有用户配置。
 *
 * `needLogin` 与 `hiddenMenuKeys` 仅用于设置页的菜单配置兼容。
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
