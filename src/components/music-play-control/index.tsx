import React from "react";

import { RiPauseCircleFill, RiPlayCircleFill, RiSkipBackFill, RiSkipForwardFill } from "@remixicon/react";

import IconButton from "@/components/icon-button";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { usePlayList } from "@/store/play-list";

const MusicPlayControl = () => {
  const list = usePlayList(state => state.list);
  const isPlaying = usePlayList(state => state.isPlaying);
  const { previous, next, togglePlay } = usePlayerActions();

  const isEmptyPlayList = list.length === 0;
  const isSingle = list.length === 1;

  return (
    <div className="flex items-center justify-center gap-5">
      <IconButton
        aria-label="上一首"
        tooltip="上一首"
        radius="full"
        onPress={previous}
        isDisabled={isEmptyPlayList || isSingle}
      >
        <RiSkipBackFill size={20} />
      </IconButton>
      <IconButton
        aria-label={isPlaying ? "暂停" : "播放"}
        tooltip={isPlaying ? "暂停" : "播放"}
        isDisabled={isEmptyPlayList}
        radius="full"
        onPress={togglePlay}
        className="text-primary size-10 min-w-10 transition-transform hover:scale-105"
      >
        {isPlaying ? <RiPauseCircleFill size={40} /> : <RiPlayCircleFill size={40} />}
      </IconButton>
      <IconButton
        aria-label="下一首"
        tooltip="下一首"
        radius="full"
        onPress={next}
        isDisabled={isEmptyPlayList || isSingle}
      >
        <RiSkipForwardFill size={20} />
      </IconButton>
    </div>
  );
};

export default MusicPlayControl;
