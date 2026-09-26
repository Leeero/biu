import type { PlaylistSummary } from "@/domain/playlist";
import type { FavoriteItem } from "@/store/favorite";

import { CollectionType } from "@/common/constants/collection";

export const adaptFavoriteItemToPlaylist = (item: FavoriteItem, isOwnedByCurrentUser: boolean): PlaylistSummary => ({
  id: `${item.type === CollectionType.VideoCollections ? "season" : "favorite-folder"}:${item.id}`,
  source: item.type === CollectionType.VideoCollections ? "season" : "favorite-folder",
  title: item.title,
  cover: item.cover,
  isOwnedByCurrentUser,
});

export const getFavoriteItemHref = (item: FavoriteItem) => {
  const type = item.type ?? CollectionType.Favorite;
  const mid = item.mid ? `&mid=${item.mid}` : "";
  return `/collection/${item.id}?type=${type}${mid}`;
};

/* ---------------------------------------------------------------- 库瓦片
 *
 * C+ 的「我的音乐库」是满幅瓦片库（16:9 封面 + 来源徽标 + 标题 + 元信息），
 * 收藏夹 / 合集 / 系列 / 本地目录在信息架构里是同一层「播放列表」。
 * 因此页面消费的是 LibraryTile —— 一个**展示视图**，而不是某个 store 的原始行。
 */

export type LibraryTileSource = "favorite-folder" | "season" | "series" | "local-dir";

export interface LibraryTile {
  /** 稳定键。本地目录用路径（路径即身份），其余用 `${source}:${id}`。 */
  key: string;
  title: string;
  source: LibraryTileSource;
  /** 徽标文案：收藏夹 / 合集 / 系列 / 本地目录。 */
  badge: string;
  /** 本地目录徽标用强调蓝芯片，其余用深色芯片。 */
  badgeVariant: "default" | "dir";
  /** 真实封面；缺省时由 artKey 决定占位渐变。 */
  cover?: string;
  /**
   * 显式占位渐变（完整 background-image 值），逐字压过 artKey 哈希选择。
   * 夹具路径用：设计稿第 2 页每枚瓦片的封面渐变是逐字比对的。
   * 注意 `cover` 是网络地址口，渐变绝不能塞进它 —— 那会得到一张必然
   * 加载失败的 `<img>`，随后静默回落到哈希渐变。
   */
  coverGradient?: string;
  /** 占位渐变的稳定键。 */
  artKey: string;
  /** 元信息（「42 首 · 3 小时 12 分」）。数据里没有统计时缺省 —— 不伪造。 */
  meta?: string;
  /** 跳转目标。本地目录去 /local-music，收藏夹/合集/系列去 /collection/:id。 */
  href: string;
  /** 收藏夹/合集/系列的领域 id（跳转与后续操作用）。 */
  favorite?: FavoriteItem;
}

const badgeOf = (type: number | undefined): { badge: string; source: LibraryTileSource } => {
  switch (type) {
    case CollectionType.VideoCollections:
      return { badge: "合集", source: "season" };
    case CollectionType.VideoSeries:
      return { badge: "系列", source: "series" };
    default:
      return { badge: "收藏夹", source: "favorite-folder" };
  }
};

export const adaptFavoriteItemToTile = (item: FavoriteItem, isOwnedByCurrentUser: boolean): LibraryTile => {
  const { badge, source } = badgeOf(item.type);
  const mid = item.mid ? `&mid=${item.mid}` : "";
  const type = item.type ?? CollectionType.Favorite;

  return {
    key: `${source}:${item.id}`,
    title: item.title,
    source,
    badge,
    badgeVariant: "default",
    cover: item.cover,
    artKey: `library-${item.id}`,
    href: `/collection/${item.id}?type=${type}${mid}`,
    favorite: isOwnedByCurrentUser ? item : undefined,
  };
};

export const adaptLocalDirToTile = (dir: string): LibraryTile => ({
  key: `local-dir:${dir}`,
  title: dir.split("/").filter(Boolean).at(-1) || dir,
  source: "local-dir",
  badge: "本地目录",
  badgeVariant: "dir",
  artKey: `local-${dir}`,
  href: "/local-music",
});

/* ---------------------------------------------------------------- 库概览
 *
 * InfoPanel 的四行。**格式化只有这一份**：真实数据与夹具数据都从这里过，
 * 两条路径渲染出的行结构才不会漂移。数据缺某一项时该行相应缩短
 * （真实账号拿不到本地文件总数，就不写「· N 个文件」）—— 不伪造。
 */

export interface LibraryOverviewInput {
  createdCount: number;
  collectedCount: number;
  /** 音质偏好的展示文案（来自 settings.audioQuality 的映射）。 */
  qualityLabel: string;
  /** 以下为可选统计：真实路径拿得到就传，拿不到就缺省。 */
  localDirs?: number;
  localFiles?: number;
  tracks?: number;
  downloadsDone?: number;
  downloadsActive?: number;
}

export const buildLibraryOverviewLines = (input: LibraryOverviewInput): string[] => {
  const lines: string[] = [];
  const total = input.createdCount + input.collectedCount;

  lines.push(`${total} 个播放列表 · 我创建 ${input.createdCount} / 我收藏 ${input.collectedCount}`);

  if (input.localDirs !== undefined) {
    lines.push(
      input.localFiles !== undefined
        ? `${input.localDirs} 个本地目录 · ${input.localFiles.toLocaleString("en-US")} 个文件`
        : `${input.localDirs} 个本地目录`,
    );
  }

  lines.push(
    input.tracks !== undefined
      ? `${input.tracks} 首 · 音质偏好 ${input.qualityLabel}`
      : `音质偏好 ${input.qualityLabel}`,
  );

  if (input.downloadsDone !== undefined && input.downloadsActive !== undefined) {
    lines.push(`下载完成 ${input.downloadsDone} · 进行中 ${input.downloadsActive}`);
  }

  return lines;
};
