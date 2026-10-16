import type { FavoriteItem } from "@/store/favorite";

import { adaptFavoriteItemToTile, adaptLocalDirToTile, favoriteTileSource, type LibraryTile } from "./model";

/**
 * 「我的音乐」的分组与显隐。
 *
 * 设置页的显隐编辑器（`pages/settings/library-settings`）与我的音乐页
 * （`pages/library`）共用这一份拆分与过滤逻辑：设置里列出的条目，必然就是
 * 页面上可能出现的瓦片 —— 两边各写一遍是这类「配置项里看不到自己刚配的东西」
 * 的经典成因。
 *
 * 显隐配置存的是**瓦片键**（`${source}:${id}`，与 `LibraryTile.key` 同值），
 * 而不是收藏项 id：收藏夹 / 合集 / 系列三类各自带来源前缀，id 相同的两项
 * 不会互相顶掉。见 `LibrarySettings.hiddenLibraryKeys`。
 */

/** 合集（season）/ 系列（series）在「我的音乐」里独立成组，不混进歌单与收藏。 */
const isCollectionTile = (tile: LibraryTile): boolean => tile.source === "season" || tile.source === "series";

/** 显隐配置里的条目键。与 `adaptFavoriteItemToTile` 生成的 `LibraryTile.key` 必须同值。 */
export const favoriteTileKey = (item: FavoriteItem): string => `${favoriteTileSource(item.type)}:${item.id}`;

export interface LibraryTileGroups {
  /** 我的歌单：自己创建、且不是合集 / 系列的收藏夹。 */
  created: LibraryTile[];
  /** 我收藏的：收藏夹（非合集 / 系列）。 */
  collected: LibraryTile[];
  /** 合集与系列：创建与收藏两侧的 season / series 合并成一组。 */
  collections: LibraryTile[];
  /** 本地目录。展示在「我的歌单」里，但不参与显隐配置（目录在本地音乐页管理）。 */
  local: LibraryTile[];
}

/** 把两个收藏列表拆成「我的歌单 / 我收藏的 / 合集与系列」三组，本地目录单列。 */
export const buildLibraryTileGroups = (
  createdFavorites: FavoriteItem[],
  collectedFavorites: FavoriteItem[],
  localMusicDirs: string[],
): LibraryTileGroups => {
  const createdTiles = createdFavorites.map(item => adaptFavoriteItemToTile(item, true));
  const collectedTiles = collectedFavorites.map(item => adaptFavoriteItemToTile(item, false));

  return {
    created: createdTiles.filter(tile => !isCollectionTile(tile)),
    collected: collectedTiles.filter(tile => !isCollectionTile(tile)),
    collections: [...createdTiles, ...collectedTiles].filter(isCollectionTile),
    local: localMusicDirs.map(dir => adaptLocalDirToTile(dir)),
  };
};

/**
 * 按显隐配置过滤收藏项**本身**。
 *
 * 在条目层过滤而不是在瓦片层：页面上的条数与曲目总数都从同一份数据算，
 * 被隐去的条目不会留在「N 首」里，也不会被「全部播放」带上。
 */
export const filterVisibleFavorites = (items: FavoriteItem[], hiddenKeys: string[]): FavoriteItem[] => {
  if (!hiddenKeys.length) return items;
  const hidden = new Set(hiddenKeys);
  return items.filter(item => !hidden.has(favoriteTileKey(item)));
};
