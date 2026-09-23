import { beforeEach, describe, expect, test, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/service/request", () => ({
  apiRequest: { get, post },
}));

import { postFavFolderFav } from "@/service/fav-folder-fav";
import { postFavFolderUnfav } from "@/service/fav-folder-unfav";
import { postFavResourceBatchDel } from "@/service/fav-resource-batch-del";
import { postFavSeasonFav } from "@/service/fav-season-fav";
import { postFavSeasonUnfav } from "@/service/fav-season-unfav";
import { getCollResourceCheck } from "@/service/medialist-gateway-coll-resource-check";
import { postCollResourceDeal } from "@/service/medialist-gateway-coll-resource-deal";

describe("favorite service parameter mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("maps audio favorite status to resource type 12", () => {
    getCollResourceCheck({ rid: 123, type: 12 });
    expect(get).toHaveBeenCalledWith("/medialist/gateway/coll/resource/check", {
      params: { rid: 123, type: 12 },
    });
  });

  test("maps audio add/remove folder ids as form data", () => {
    postCollResourceDeal({ rid: 123, type: 12, add_media_ids: "1,2", del_media_ids: "3" });
    expect(post).toHaveBeenCalledWith(
      "/medialist/gateway/coll/resource/deal",
      { rid: 123, type: 12, add_media_ids: "1,2", del_media_ids: "3" },
      { useFormData: true },
    );
  });

  test("maps video folder follow and unfollow with CSRF form options", () => {
    postFavFolderFav({ media_id: 11, platform: "web" });
    expect(post).toHaveBeenCalledWith(
      "/x/v3/fav/folder/fav",
      { media_id: 11, platform: "web" },
      { useCSRF: true, useFormData: true },
    );

    postFavFolderUnfav({ media_id: 11, platform: "web" });
    expect(post).toHaveBeenCalledWith(
      "/x/v3/fav/folder/unfav",
      { media_id: 11, platform: "web" },
      { useCSRF: true, useFormData: true },
    );
  });

  test("maps collection follow and unfollow with CSRF form options", () => {
    postFavSeasonFav({ season_id: 22, platform: "web" });
    expect(post).toHaveBeenCalledWith(
      "/x/v3/fav/season/fav",
      { season_id: 22, platform: "web" },
      { useCSRF: true, useFormData: true },
    );

    postFavSeasonUnfav({ season_id: 22, platform: "web" });
    expect(post).toHaveBeenCalledWith(
      "/x/v3/fav/season/unfav",
      { season_id: 22, platform: "web" },
      { useCSRF: true, useFormData: true },
    );
  });

  test("preserves typed resource ids when removing favorite contents", () => {
    postFavResourceBatchDel({ media_id: 11, resources: "100:2,200:12,300:21", platform: "web" });
    expect(post).toHaveBeenCalledWith(
      "/x/v3/fav/resource/batch-del",
      { media_id: 11, resources: "100:2,200:12,300:21", platform: "web" },
      { useCSRF: true, useFormData: true },
    );
  });
});
