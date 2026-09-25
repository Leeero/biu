import React from "react";

import MusicPlayControl from "@/components/music-play-control";
import MusicPlayProgress from "@/components/music-play-progress";
import { usePlayList } from "@/store/play-list";

/**
 * 播放栏中段：传输控件与进度条同处一行（设计稿构图），整段在壳层里水平居中。
 *
 * 进度条宽度 `min(392px, 27.5vw)`：392 是设计稿在 1440 下的实测值，
 * 27.5vw 是它的等比收缩上限——窗口收窄时先压进度条，不压按钮。
 * 两段之间的 53px 间距同样取自设计稿实测。
 */
const Control = () => {
  const list = usePlayList(state => state.list);
  const isEmptyPlayList = list.length === 0;

  return (
    <div className="flex items-center">
      <MusicPlayControl />
      <MusicPlayProgress isDisabled={isEmptyPlayList} className="ml-[53px] w-[min(392px,27.5vw)]" />
    </div>
  );
};

export default Control;
