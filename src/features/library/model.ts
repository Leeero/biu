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
