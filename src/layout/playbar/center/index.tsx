import React from "react";

import MusicPlayControl from "@/components/music-play-control";
import MusicPlayProgress from "@/components/music-play-progress";
import { useNowPlaying } from "@/features/player/now-playing";

/**
 * 播放栏中段：传输控件 + 进度条 + 时间，同处一行（设计稿构图）。
 *
 * 进度条宽 `min(380px, 26.5vw)`（spec-lock `geometry.playbar.mid.progressWidth`）。380 是设计稿
 * 实测值：条带 x792–1171 = 380，而**左缘 792 与「中段起点 603 + transport 136 +
 * 间距 53」恰好一致** —— 左缘相同而右缘差 12px，说明偏差在宽度而非起点，故取设计稿值
 * （原型 `.pb-progress { width: 392px }` 是原型档）。窗口收窄时先压进度条，不压按钮。
 * 与控件之间的 53px 间距同样取自设计稿实测（`--biu-playbar-progress-ml`）。
 *
 * 宽度给的是 `barClassName`（条本体），不是 `className`（条 + 时间的外层）——
 * 给外层会被时间标签挤窄（1.3.9 的 270.5 即由此而来，见 `geometry.playbar.mid.progressWidthScope`）。
 * 外层只留左边距。
 */
const Control = () => {
  const { controlsDisabled } = useNowPlaying();

  return (
    <div className="flex w-full min-w-0 items-center">
      <MusicPlayControl />
      <MusicPlayProgress
        isDisabled={controlsDisabled}
        className="ml-[clamp(24px,3vw,var(--biu-playbar-progress-ml))] min-w-0 flex-1"
        barClassName="min-w-[120px] max-w-[var(--biu-playbar-progress-w)] flex-1"
      />
    </div>
  );
};

export default Control;
