import { describe, expect, test } from "vitest";

import { adaptLocalMusicToTrack } from "@/adapters/track/local";
import {
  adaptNewMusicBannerToTrack,
  adaptNewMusicToTrack,
  adaptRankItemToTrack,
  adaptRegionArchiveToTrack,
  dedupeTracks,
} from "@/adapters/track/recommendation";
import { getTrackCapabilities } from "@/domain/track";

describe("track adapters", () => {
  test("maps a region recommendation without leaking its DTO shape", () => {
    const track = adaptRegionArchiveToTrack(
      {
        aid: 100,
        bvid: "BV100",
        cid: 200,
        title: "Song",
        cover: "cover.jpg",
        duration: 180,
        pubdate: 1_700_000_000,
        author: { mid: 9, name: "Artist" },
        stat: { view: 99 },
      },
      "fallback",
    );

    expect(track).toEqual({
      id: "bilibili-video:BV100",
      source: "bilibili-video",
      title: "Song",
      cover: "cover.jpg",
      creator: { id: "9", name: "Artist" },
      duration: 180,
      playCount: 99,
      publishedAt: new Date(1_700_000_000 * 1000).toISOString(),
      sourceRef: { aid: "100", bvid: "BV100", cid: "200" },
    });
  });

  test("prefers related archive metadata for ranking items", () => {
    const track = adaptRankItemToTrack(
      {
        id: 1,
        music_title: "Music title",
        music_id: "m1",
        music_corner: "",
        cid: "old-cid",
        jump_url: "",
        author: "Old artist",
        bvid: "BVOLD",
        album: "",
        aid: "10",
        cover: "old.jpg",
        score: 1,
        related_archive: {
          aid: "20",
          bvid: "BVNEW",
          cid: "new-cid",
          cover: "new.jpg",
          title: "Archive title",
          uid: 2,
          username: "Artist",
          vt_display: "",
          vv_count: 100,
          is_vt: 0,
          fname: "",
          duration: 200,
        },
      },
      "rank-1",
    );
    expect(track).toMatchObject({
      id: "bilibili-video:BVNEW",
      title: "Archive title",
      cover: "new.jpg",
      creator: { id: "2", name: "Artist" },
      sourceRef: { aid: "20", bvid: "BVNEW", cid: "new-cid" },
    });
  });

  test("maps new music and banner records to the same stable identity", () => {
    const listTrack = adaptNewMusicToTrack({ bvid: "BV1", music_title: "A", cover: "a.jpg" }, "list");
    const bannerTrack = adaptNewMusicBannerToTrack({ bvid: "BV1", archive_title: "A" }, "banner");
    expect(dedupeTracks([bannerTrack, listTrack])).toEqual([bannerTrack]);
  });

  test("maps local files to playable local tracks", () => {
    const track = adaptLocalMusicToTrack({
      id: "file-1",
      path: "C:\\Music\\a.mp3",
      dir: "C:\\Music",
      title: "Local",
      size: 10,
      format: "mp3",
      duration: 120,
    });
    expect(track).toMatchObject({
      id: "local:file-1",
      source: "local",
      sourceRef: { localPath: "C:\\Music\\a.mp3", audioUrl: "file://C:/Music/a.mp3" },
    });
  });

  test("derives actions only from existing backend and local capabilities", () => {
    const video = adaptRegionArchiveToTrack({ aid: 100, bvid: "BV100", title: "Song", cover: "cover.jpg" }, "fallback");
    expect(getTrackCapabilities(video, { isLoggedIn: false })).toMatchObject({
      canPlay: true,
      canFavorite: false,
      canDownloadAudio: true,
      canDownloadVideo: true,
    });
    expect(getTrackCapabilities(video, { isLoggedIn: true }).canFavorite).toBe(true);

    const unavailable = adaptNewMusicToTrack({ music_title: "No source" }, "missing");
    expect(getTrackCapabilities(unavailable, { isLoggedIn: true })).toMatchObject({
      canPlay: false,
      canFavorite: false,
      canDownloadAudio: false,
      canDownloadVideo: false,
    });
  });
});
