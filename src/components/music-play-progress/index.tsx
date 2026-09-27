import { memo, useState } from "react";

import { Slider } from "@heroui/react";
import { twMerge } from "tailwind-merge";

import { formatDuration } from "@/common/utils/time";
import { useNowPlaying } from "@/features/player/now-playing";
import { usePlayerActions } from "@/features/player/use-player-actions";

interface Props {
  isDisabled?: boolean;
  className?: string;
  /** 作用于**进度条本体**（Slider），如播放栏的定宽 `min(380px, 26.5vw)`。 */
  barClassName?: string;
  trackClassName?: string;
}

/**
 * 播放进度：进度槽 + **单枚尾随时间**。
 *
 * 与上一版的差别（spec-lock `geometry.playbar.mid`，1.3.9 补录）：
 *   · 时间从「进度条两侧各一枚 11px 三级文字」改为**进度条右侧的单枚 13px
 *     `--biu-text-secondary` 标签**「01:22 / 03:48」。依据：设计稿第 3 页的时间墨迹
 *     x1197–1264 是**一段**（宽 67，正好是「mm:ss / mm:ss」在 13px 下的宽度），
 *     不是两段；原型的 `.pb-time` 也是单枚（`margin-left: 14`，本实现取实测的 26）。
 *   · 进度槽高从 3px 改回 **4px**（`--biu-playbar-progress-h`）、圆角 2、轨道色
 *     `--biu-veil-18`（设计稿实测槽底的三通道是 57/57/59、压在亮度 14.2 的栏底上
 *     ⇒ 17.8%，且 18% 档在色板上登记的用途就是「进度槽」；原型 `.pb-progress` 的
 *     22% 是原型档）。
 *   · 填充色 `--biu-accent`，不再借 HeroUI 的 `bg-primary` —— 那是 HeroUI 主题色，
 *     绕过了 C+ 色板。
 *   · 宽度由调用方给，但**必须给到条本体**（`barClassName`），不能给到外层容器：
 *     spec-lock `geometry.playbar.mid.progressWidth` 说的是**条自身**的宽（设计稿实测
 *     条带 x792–1171 = 380，时间在它之外 x1196–1265）。1.3.9 曾把宽度落在外层
 *     「条 + 时间」的 flex 上，`flex-1` 的条于是被时间标签挤成 380 − 26 − 83.5 =
 *     **270.5**（DOM 实测），而播放入口看起来只是「条短了一点」——闸门直到 1.3.10
 *     补上横向实心带判定才抓得住。沉浸态给外层 `w-full`、条保持 `flex-1` 即可。
 *
 * 读 DOM 时的一个陷阱：填充片的 `getBoundingClientRect()` 比轨道的可见左缘**内缩 10px**
 * （HeroUI 用 `border-x-transparent` 给滑块留位置），但像素上填充是**齐左**的 —— 设计稿
 * 第 3 页与渲染同为「填充起于 x792」，填充色也一致（设计 41/149/253、渲染 41/151/255）。
 * 别照着那个 box 去「修」填充的对齐。
 */
const MusicPlayProgress = memo(({ isDisabled, className, barClassName, trackClassName }: Props) => {
  const [hovered, setHovered] = useState(false);
  const { currentTime, duration } = useNowPlaying();
  const { seek } = usePlayerActions();

  const showThumb = !isDisabled && hovered;

  return (
    <div className={twMerge("flex items-center", className)}>
      <Slider
        aria-label="播放进度"
        hideThumb={!showThumb}
        minValue={0}
        maxValue={duration}
        value={currentTime}
        onChange={v => seek(v as number)}
        isDisabled={isDisabled}
        size="sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={twMerge("flex-1", barClassName)}
        classNames={{
          track: twMerge(
            "h-[var(--biu-playbar-progress-h)] cursor-pointer rounded-[2px] bg-[var(--biu-veil-18)]",
            trackClassName,
          ),
          filler: "rounded-[2px] bg-[rgb(var(--biu-accent))]",
          thumb: "size-3 bg-[rgb(var(--biu-accent))] after:hidden",
        }}
      />
      <span className="ml-[var(--biu-playbar-time-gap)] flex-none text-[length:var(--biu-type-label-size)] whitespace-nowrap text-[rgb(var(--biu-text-secondary))] tabular-nums">
        {currentTime ? formatDuration(currentTime) : "-:--"} / {duration ? formatDuration(duration) : "-:--"}
      </span>
    </div>
  );
});

export default MusicPlayProgress;
