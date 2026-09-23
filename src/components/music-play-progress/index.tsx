import { memo, useState } from "react";

import { Slider } from "@heroui/react";
import { twMerge } from "tailwind-merge";

import { formatDuration } from "@/common/utils/time";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { usePlayList } from "@/store/play-list";
import { usePlayProgress } from "@/store/play-progress";

interface Props {
  isDisabled?: boolean;
  className?: string;
  trackClassName?: string;
}

const MusicPlayProgress = memo(({ isDisabled, className, trackClassName }: Props) => {
  const [hovered, setHovered] = useState(false);
  const currentTime = usePlayProgress(s => s.currentTime);
  const duration = usePlayList(s => s.duration);
  const { seek } = usePlayerActions();

  const showThumb = !isDisabled && hovered;

  return (
    <div className={twMerge("flex w-3/4 items-center gap-2", className)}>
      <div className="flex w-10 justify-end text-[11px] whitespace-nowrap text-[rgb(var(--biu-color-text-tertiary))] tabular-nums">
        {currentTime ? formatDuration(currentTime) : "-:--"}
      </div>
      <Slider
        aria-label="播放进度"
        hideThumb={!showThumb}
        minValue={0}
        maxValue={duration}
        value={currentTime}
        onChange={v => seek(v as number)}
        isDisabled={isDisabled}
        size="sm"
        color={showThumb ? "primary" : "foreground"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex-1"
        classNames={{
          track: twMerge("h-[3px] cursor-pointer", trackClassName),
          filler: "bg-primary",
          thumb: "w-3 h-3 bg-primary after:hidden shadow-sm",
        }}
      />
      <span className="flex w-10 justify-start text-[11px] whitespace-nowrap text-[rgb(var(--biu-color-text-tertiary))] tabular-nums">
        {duration ? formatDuration(duration) : "-:--"}
      </span>
    </div>
  );
});

export default MusicPlayProgress;
