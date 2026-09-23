import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";

import { getTrackSourceUrl, toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";

export type TrackActionKey =
  | "play"
  | "play-next"
  | "add-to-playlist"
  | "favorite"
  | "download-audio"
  | "download-video"
  | "open-source";

export interface TrackActionOptions {
  onFavoriteSuccess?: (selectedIds: number[]) => void;
}

interface TrackActionDependencies {
  play: (track: Track) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  favorite: (track: Track, onSuccess?: (selectedIds: number[]) => void) => boolean;
  download: (track: Track, output: MediaDownloadOutputFileType) => Promise<boolean>;
  openSource: (track: Track) => boolean;
}

export const createTrackActionExecutor =
  (dependencies: TrackActionDependencies) =>
  async (key: TrackActionKey, track: Track, options: TrackActionOptions = {}) => {
    switch (key) {
      case "play":
        dependencies.play(track);
        return true;
      case "play-next":
        dependencies.playNext(track);
        return true;
      case "add-to-playlist":
        dependencies.addToQueue(track);
        return true;
      case "favorite":
        return dependencies.favorite(track, options.onFavoriteSuccess);
      case "download-audio":
        return dependencies.download(track, "audio");
      case "download-video":
        return dependencies.download(track, "video");
      case "open-source":
        return dependencies.openSource(track);
    }
  };

export const executeTrackAction = createTrackActionExecutor({
  play: track => usePlayList.getState().play(toPlayItem(track)),
  playNext: track => usePlayList.getState().addToNext(toPlayItem(track)),
  addToQueue: track => usePlayList.getState().addList([toPlayItem(track)]),
  favorite: (track, onSuccess) => {
    const selection = toFavoriteSelection(track);
    if (!selection) return false;
    useModalStore.getState().onOpenFavSelectModal({ ...selection, onSuccess });
    return true;
  },
  download: async (track, output) => {
    const task = toMediaDownloadInfo(track, output);
    if (!task) return false;
    await window.electron.addMediaDownloadTask(task);
    addToast({ title: "已添加下载任务", color: "success" });
    return true;
  },
  openSource: track => {
    const url = getTrackSourceUrl(track);
    if (!url) return false;
    window.electron.openExternal(url);
    return true;
  },
});
