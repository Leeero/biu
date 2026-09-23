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

export const DefaultMenuList: (MenuItemProps & { needLogin?: boolean })[] = [
  {
    title: "发现音乐",
    href: "/",
    icon: RiDiscLine,
    activeIcon: RiDiscFill,
  },
  {
    title: "我的收藏",
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

export const DiscoveryMenuHrefs = ["/"];
export const LibraryMenuHrefs = ["/library", "/later", "/local-music", "/download-list"];
