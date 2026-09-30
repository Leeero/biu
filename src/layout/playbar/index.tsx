import { useNowPlaying } from "@/features/player/now-playing";

import Center from "./center";
import Deferred from "./deferred";
import Left from "./left";
import Right from "./right";

/**
 * 播放任务栏。高度由壳层给（`--biu-layout-player-h` = 88，硬锚点）。
 *
 * 播放栏使用三栏网格：当前曲目 / 播放控制与进度 / 队列。每一栏都有明确边界，
 * 长标题、系统缩放与三位数队列都不能侵占相邻区域。
 *
 * 中间区域允许进度条弹性收缩；控制按钮和时间读数保持固定宽度。较窄窗口隐藏辅助
 * 控件簇，但播放、上一首、下一首、进度和队列入口始终保留。
 *
 * 左段的存在条件从 `playId` 改为 `nowPlaying.title`：夹具模式下没有真实的
 * `playId`（演示队列不写进持久化 store，见 `features/player/now-playing.ts`），
 * 但设计稿的播放栏是满态 —— 判据应当是「有没有可显示的内容」，而不是「store 里
 * 有没有 id」。
 */
function PlayBar() {
  const { title } = useNowPlaying();

  return (
    <div className="grid h-full w-full grid-cols-[minmax(280px,430px)_minmax(0,1fr)_auto] items-center gap-x-6 px-[var(--biu-playbar-inset-l)]">
      <div className="min-w-0 overflow-hidden">{Boolean(title) && <Left />}</div>
      <div className="flex min-w-0 items-center justify-center gap-5">
        <div className="flex-none max-[1320px]:hidden">
          <Deferred />
        </div>
        <div className="min-w-0 flex-1">
          <Center />
        </div>
      </div>
      <div className="justify-self-end">
        <Right />
      </div>
    </div>
  );
}

export default PlayBar;
