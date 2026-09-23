import { describe, expect, it } from "vitest";

import { getPlaylistCapabilities } from "@/features/playlist/capabilities";

describe("playlist capabilities", () => {
  it("allows owners to manage a non-default favorite folder", () => {
    expect(
      getPlaylistCapabilities({
        source: "favorite-folder",
        isLoggedIn: true,
        isOwnedByCurrentUser: true,
        hasTracks: true,
      }),
    ).toMatchObject({
      canPlay: true,
      canFavorite: false,
      canEdit: true,
      canDelete: true,
      canCleanInvalid: true,
    });
  });

  it("does not expose unsupported management actions for a collected series", () => {
    expect(
      getPlaylistCapabilities({
        source: "series",
        isLoggedIn: true,
        isOwnedByCurrentUser: false,
        hasTracks: true,
      }),
    ).toMatchObject({
      canFavorite: false,
      canEdit: false,
      canDelete: false,
      canCleanInvalid: false,
      canBatchDownloadAudio: true,
    });
  });

  it("disables playback and queue actions for an empty playlist", () => {
    expect(
      getPlaylistCapabilities({
        source: "season",
        isLoggedIn: false,
        isOwnedByCurrentUser: false,
        hasTracks: false,
      }),
    ).toMatchObject({ canPlay: false, canAddToQueue: false, canFavorite: false });
  });
});
