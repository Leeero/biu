import { useEffect } from "react";

import { usePlayList } from "@/store/play-list";

import Center from "./center";
import Left from "./left";
import Right from "./right";

/**
 * 播放任务栏。高度由壳层给（`--biu-layout-player-h` = 88，硬锚点）。
 *
 * 排布方式从「三列网格」改为「三段绝对定位」，与设计稿的构图一致：
 *   · 左段贴左 36px，展示当前曲目；无播放项时不渲染，避免空态占位。
 *   · 中段水平居中。
 *   · 右段贴右 22px——这个值刻意与顶栏右内边距相同，两栏右缘对齐。
 *
 * 与原型的一处有意偏离：原型把中段写成 `left: calc(50% - 117px)`，是一个
 * **只在 1440 下成立**的魔数偏移（中段实际宽约 610，按该式并不居中）。
 * 该偏移未登记进 spec-lock（真值里 playbar 只有 `height: 88px` 一条硬锚点），
 * 因此按「令牌锚定 + 弹性容器」的策略改为真正的水平居中，
 * 并把进度条宽度收成 `min(392px, 27.5vw)`，让窄窗口下三段不会互相叠压。
 */
function PlayBar() {
  const playId = usePlayList(s => s.playId);
  const init = usePlayList(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-1/2 left-9 -translate-y-1/2">{Boolean(playId) && <Left />}</div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Center />
      </div>
      <div className="absolute top-1/2 right-[22px] -translate-y-1/2">
        <Right />
      </div>
    </div>
  );
}

export default PlayBar;
