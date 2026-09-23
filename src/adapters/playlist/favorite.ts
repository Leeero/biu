import type { PlaylistSummary } from "@/domain/playlist";
import type { FavFolderCollectedItem } from "@/service/fav-folder-collected-list";
import type { FavFolderCreatedList } from "@/service/fav-folder-created-list";

export const adaptCreatedFavoriteToPlaylist = (item: FavFolderCreatedList): PlaylistSummary => ({
  id: `favorite-folder:${item.id}`,
  source: "favorite-folder",
  title: item.title,
  cover: item.cover,
  creator: { id: String(item.upper.mid), name: item.upper.name, avatar: item.upper.face },
  trackCount: item.media_count,
  isOwnedByCurrentUser: true,
});

export const adaptCollectedFavoriteToPlaylist = (item: FavFolderCollectedItem): PlaylistSummary => ({
  id: `${item.type === 21 ? "season" : "favorite-folder"}:${item.id}`,
  source: item.type === 21 ? "season" : "favorite-folder",
  title: item.title,
  cover: item.cover,
  creator: { id: String(item.upper.mid), name: item.upper.name, avatar: item.upper.face },
  trackCount: item.media_count,
  isOwnedByCurrentUser: false,
});
