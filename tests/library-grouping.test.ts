import { describe, expect, it } from "vitest";

import type { FavoriteItem } from "@/store/favorite";

import { CollectionType } from "@/common/constants/collection";
import { buildLibraryTileGroups, favoriteTileKey, filterVisibleFavorites } from "@/features/library/grouping";
import { adaptFavoriteItemToTile } from "@/features/library/model";

const favorite = (id: number, title: string, type?: number): FavoriteItem => ({ id, title, type });

describe("library grouping", () => {
  it("拆成我的歌单 / 我收藏的 / 合集与系列，本地目录单列", () => {
    const groups = buildLibraryTileGroups(
      [favorite(1, "通勤"), favorite(2, "演唱会", CollectionType.VideoCollections)],
      [favorite(3, "古典"), favorite(4, "纪录片", CollectionType.VideoSeries)],
      ["/music/only"],
    );

    expect(groups.created.map(tile => tile.key)).toEqual(["favorite-folder:1"]);
    expect(groups.collected.map(tile => tile.key)).toEqual(["favorite-folder:3"]);
    expect(groups.collections.map(tile => [tile.key, tile.badge])).toEqual([
      ["season:2", "合集"],
      ["series:4", "系列"],
    ]);
    expect(groups.local.map(tile => tile.key)).toEqual(["local-dir:/music/only"]);
  });

  it("显隐配置键与瓦片键同值（含 type 为 0 的普通收藏夹）", () => {
    const items = [
      favorite(1, "普通"),
      favorite(2, "缺 type"),
      favorite(3, "合集", CollectionType.VideoCollections),
      favorite(4, "系列", CollectionType.VideoSeries),
      favorite(5, "type=0", 0),
    ];

    for (const item of items) {
      expect(favoriteTileKey(item)).toBe(adaptFavoriteItemToTile(item, true).key);
    }
  });

  it("只隐藏被勾掉的条目，其余原样保留", () => {
    const created = [favorite(1, "通勤"), favorite(2, "综艺", CollectionType.VideoCollections)];
    const collected = [favorite(3, "古典")];

    expect(filterVisibleFavorites(created, ["favorite-folder:1"]).map(item => item.id)).toEqual([2]);
    expect(filterVisibleFavorites(collected, ["favorite-folder:1"]).map(item => item.id)).toEqual([3]);
    expect(filterVisibleFavorites(created, []).map(item => item.id)).toEqual([1, 2]);
  });

  it("同 id 的收藏夹与合集互不影响（靠来源前缀区分）", () => {
    const items = [favorite(7, "歌单"), favorite(7, "合集", CollectionType.VideoCollections)];

    expect(filterVisibleFavorites(items, ["season:7"]).map(item => item.title)).toEqual(["歌单"]);
    expect(filterVisibleFavorites(items, ["favorite-folder:7"]).map(item => item.title)).toEqual(["合集"]);
  });
});
