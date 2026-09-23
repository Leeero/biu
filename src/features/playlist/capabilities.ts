import type { PlaylistCapabilities } from "@/domain/capabilities";
import type { PlaylistSource } from "@/domain/playlist";

interface PlaylistCapabilityInput {
  source: PlaylistSource;
  isLoggedIn: boolean;
  isOwnedByCurrentUser: boolean;
  hasTracks: boolean;
  isDefaultPlaylist?: boolean;
}

export const getPlaylistCapabilities = ({
  source,
  isLoggedIn,
  isOwnedByCurrentUser,
  hasTracks,
  isDefaultPlaylist = false,
}: PlaylistCapabilityInput): PlaylistCapabilities => {
  const isFavoriteFolder = source === "favorite-folder";
  const isRemotePlaylist = source !== "local-library";

  return {
    canPlay: hasTracks,
    canAddToQueue: hasTracks,
    canFavorite: isLoggedIn && isRemotePlaylist && !isOwnedByCurrentUser && source !== "series",
    canEdit: isLoggedIn && isFavoriteFolder && isOwnedByCurrentUser,
    canDelete: isLoggedIn && isFavoriteFolder && isOwnedByCurrentUser && !isDefaultPlaylist,
    canCleanInvalid: isLoggedIn && isFavoriteFolder && isOwnedByCurrentUser && hasTracks,
    canBatchDownloadAudio: hasTracks,
    canBatchDownloadVideo: hasTracks && isRemotePlaylist,
  };
};
