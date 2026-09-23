import { useMemo } from "react";

import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";

interface PlayerActionDependencies {
  togglePlay: () => void;
  previous: () => Promise<void>;
  next: () => Promise<void>;
  seek: (seconds: number) => void;
  playQueueItem: (id: string) => Promise<void>;
  removeQueueItem: (id: string) => void;
  clearQueue: () => void;
  togglePlayMode: () => void;
  openQueue: () => void;
  openNowPlaying: () => void;
}

export const createPlayerActions = (dependencies: PlayerActionDependencies) => ({
  togglePlay: dependencies.togglePlay,
  previous: dependencies.previous,
  next: dependencies.next,
  seek: dependencies.seek,
  playQueueItem: dependencies.playQueueItem,
  removeQueueItem: dependencies.removeQueueItem,
  clearQueue: dependencies.clearQueue,
  togglePlayMode: dependencies.togglePlayMode,
  openQueue: dependencies.openQueue,
  openNowPlaying: dependencies.openNowPlaying,
});

export const usePlayerActions = () => {
  const togglePlay = usePlayList(state => state.togglePlay);
  const previous = usePlayList(state => state.prev);
  const next = usePlayList(state => state.next);
  const seek = usePlayList(state => state.seek);
  const playQueueItem = usePlayList(state => state.playListItem);
  const removeQueueItem = usePlayList(state => state.delPage);
  const clearQueue = usePlayList(state => state.clear);
  const togglePlayMode = usePlayList(state => state.togglePlayMode);
  const setQueueOpen = useModalStore(state => state.setPlayListDrawerOpen);
  const openNowPlaying = useModalStore(state => state.openFullScreenPlayer);

  return useMemo(
    () =>
      createPlayerActions({
        togglePlay,
        previous,
        next,
        seek,
        playQueueItem,
        removeQueueItem,
        clearQueue,
        togglePlayMode,
        openQueue: () => setQueueOpen(true),
        openNowPlaying,
      }),
    [
      clearQueue,
      next,
      openNowPlaying,
      playQueueItem,
      previous,
      removeQueueItem,
      seek,
      setQueueOpen,
      togglePlay,
      togglePlayMode,
    ],
  );
};
