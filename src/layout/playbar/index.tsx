import { useEffect } from "react";

import { useNowPlaying } from "@/features/player/now-playing";
import { usePlayList } from "@/store/play-list";

import Center from "./center";
import Deferred from "./deferred";
import Left from "./left";
import Right from "./right";

/**
 * 播放任务栏。高度由壳层给（`--biu-layout-player-h` = 88，硬锚点）。
 *
 * 四段**绝对定位**，内距取自 spec-lock `geometry.playbar`（1.3.9 起播放栏内部进真值；
 * 此前真值里只有 `height` 一条，栏内一律不受闸门约束）：
 *   · 左段贴左 32（`--biu-playbar-inset-l`）
 *   · 中段原点 `calc(50% - 117px)`（`--biu-playbar-mid-offset`）
 *   · 右段贴右 52（`--biu-playbar-inset-r`）—— 只有设计钉住的那一枚药丸
 *   · 过渡控件簇：右缘贴中段原点左侧 12px（1.3.10 起；见 `./deferred` 的推导）
 *
 * 中段为什么不是「真正居中」：设计稿的中段（传输控件 + 进度条 + 时间）整体偏右。
 * 原点 603 时上一首落 603–625、播放键 648–695、下一首 720–742、进度条 792–1171、
 * 时间 1197–1264，与设计稿逐项吻合；改成按中段自身宽度居中会让整段左移约 215px。
 *
 * 与顶栏的一处**有意不对齐**：设计稿顶栏右内距实测 ≈ 24、播放栏 ≈ 51，两者本就不等
 * （原注释写「刻意与顶栏右内边距相同，两栏右缘对齐」，与稿面不符，已订正）。
 *
 * 左段的存在条件从 `playId` 改为 `nowPlaying.title`：夹具模式下没有真实的
 * `playId`（演示队列不写进持久化 store，见 `features/player/now-playing.ts`），
 * 但设计稿的播放栏是满态 —— 判据应当是「有没有可显示的内容」，而不是「store 里
 * 有没有 id」。
 */
function PlayBar() {
  const init = usePlayList(state => state.init);
  const { title } = useNowPlaying();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-1/2 left-[var(--biu-playbar-inset-l)] -translate-y-1/2">
        {Boolean(title) && <Left />}
      </div>
      <div className="absolute top-1/2 left-[calc(50%_-_var(--biu-playbar-mid-offset))] -translate-y-1/2">
        <Center />
      </div>
      <div className="absolute top-1/2 right-[calc(50%_+_var(--biu-playbar-mid-offset)_+_var(--biu-playbar-deferred-gutter))] -translate-y-1/2">
        <Deferred />
      </div>
      <div className="absolute top-1/2 right-[var(--biu-playbar-inset-r)] -translate-y-1/2">
        <Right />
      </div>
    </div>
  );
}

export default PlayBar;
