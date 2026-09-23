import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";
import type { PlayItem } from "@/store/play-list";

import { toPlayItem } from "@/adapters/track/actions";
import { usePlayList } from "@/store/play-list";

export type PlaylistBulkAction = "play-all" | "add-all";

interface BulkActionDependencies {
  playAll: (items: PlayItem[]) => void | Promise<void>;
  addAll: (items: PlayItem[]) => void;
  notifyAdded: (count: number) => void;
}

export const createPlaylistBulkActionExecutor =
  (dependencies: BulkActionDependencies) => async (action: PlaylistBulkAction, tracks: Track[]) => {
    const items = tracks.map(toPlayItem);
    if (!items.length) return false;
    if (action === "play-all") await dependencies.playAll(items);
    else {
      dependencies.addAll(items);
      dependencies.notifyAdded(items.length);
    }
    return true;
  };

export const executePlaylistBulkAction = createPlaylistBulkActionExecutor({
  playAll: items => usePlayList.getState().playList(items),
  addAll: items => usePlayList.getState().addList(items),
  notifyAdded: count => addToast({ title: `已添加 ${count} 首到播放列表`, color: "success" }),
});
