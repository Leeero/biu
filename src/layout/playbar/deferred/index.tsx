import MusicDownloadButton from "@/components/music-download-button";
import MusicPlayMode from "@/components/music-play-mode";
import MusicRate from "@/components/music-rate";
import MusicVolume from "@/components/music-volume";
import OpenPlaylistDrawerButton from "@/components/open-playlist-drawer-button";
import { useNowPlaying } from "@/features/player/now-playing";

/**
 * 播放栏「过渡控件簇」—— 设计稿里**不存在**、但能力不能丢的那一组，承接到 P5。
 *
 * ## 为什么从右段搬到这里
 *
 * 设计稿 12 页的播放栏右段**恒为一枚「队列 · N」药丸**（第 11 页是沉浸态、无播放栏）。
 * 1.3.9 把 5 枚过渡控件留在右段的实测后果不是「多了几个图标」，而是**横向重叠**：
 * 5 枚 32px 控件占 x1080.8–1388，而中段的尾随时间在 x1088.5–1172 —— 时间读数被控件
 * 压住（DOM 实测，`playbarGap` 窗口 x1176–1194 内实有 17 列墨迹、峰值亮度 204）。
 *
 * 右段没有第二种排法：药丸右缘由设计钉在 x1388（右内距 52，5 页同值）⇒ 右段可用宽
 * `1440 − 52 − 89 − 中段右缘`，**只剩得下药丸本身**。
 *
 * ## 为什么是这个位置
 *
 * 唯一未被设计占用、且既不属于中段也不属于药丸的横向区带，是**左段与中段之间**：
 * 左段最右可达 `32 + 100 + 21 + 300 = 453`（`metaMaxWidth` 的成文用途即「防长标题
 * 撞进中段」），中段原点 603 ⇒ 设计预留的缓冲是 150。本簇取其中两侧各留 12 的一段，
 * 即 126 = `5 × 22 + 4 × 4`，且恒等式 `453 + 12 + 126 + 12 = 603 ≡ 中段原点`
 * 成立 —— 该式只由令牌构成，不含字体宽度、不含业务数据，可在 `tests/design-tokens.test.ts`
 * 里直接断言。
 *
 * ## 为什么按钮是 22px
 *
 * 不是新造档位：22 就是中段传输按钮的尺寸（`--biu-playbar-transport-icon`）。
 * `IconButton` 最小的 `size="sm"` 是 32，5 枚即 `5×32 + 4×g`，即使 `g = 0` 也 160 > 126，
 * 必然越界。22 档下按钮的实心墨迹仍约 14px，图标之间视觉间距约 8px，可读。
 *
 * ## 去留
 *
 * 方案 §5.4 规定这组组件「保留能力、只改外观」，§6 的 P3 出口标准要求能力不退化；
 * 其中「播放模式」与「抽屉入口」在全屏播放器里另有落点，但**「音量」「倍速」「下载」
 * 只存在于播放栏** —— 此时删掉就是能力倒退。它们的目的地是沉浸态 `/now-playing`
 * 控制带右段（施工矩阵 §10 第 6 条），属 **P5** 交付物，届时本组件整体删除。
 * 完整登记见 spec-lock `geometry.playbar.deferred`。
 */
const DeferredControl = () => {
  const { sourceIsLocal } = useNowPlaying();

  return (
    <div
      className={[
        "flex items-center justify-end gap-[var(--biu-playbar-deferred-gap)]",
        "text-[rgb(var(--biu-text-secondary))]",
        // 只收窄**直接子级**按钮：本组 5 个组件里有 2 个（音量、倍速）带 Tooltip/Popover，
        // 其内容会被 HeroUI 传送到 body，故 `> button` 不会误伤浮层里的按钮。
        "[&>button]:size-[var(--biu-playbar-transport-icon)] [&>button]:min-w-0",
      ].join(" ")}
    >
      <MusicPlayMode />
      {!sourceIsLocal && <MusicDownloadButton />}
      {/* 过渡期的两个队列入口：药丸（`/queue` 路由，目标形态）与抽屉（兜底）。
          P5 删除抽屉后只留前者，见 spec-lock `geometry.playbar.right.segmentDeferral`。 */}
      <OpenPlaylistDrawerButton />
      <MusicVolume />
      <MusicRate />
    </div>
  );
};

export default DeferredControl;
