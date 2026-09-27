import { RiOrderPlayLine, RiRepeat2Line, RiRepeatOneLine, RiShuffleLine } from "@remixicon/react";

export const PlayRate = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * 播放模式
 */
export enum PlayMode {
  /**
   * 顺序播放
   */
  Sequence = 1,
  /**
   * 循环播放
   */
  Loop = 2,
  /**
   * 随机播放
   */
  Random = 3,
  /**
   * 单曲播放
   */
  Single = 4,
}

export const getPlayModeList = (iconSize?: number) => [
  {
    value: PlayMode.Sequence,
    desc: "顺序播放",
    icon: <RiOrderPlayLine size={iconSize} />,
  },
  {
    value: PlayMode.Loop,
    desc: "循环播放",
    icon: <RiRepeat2Line size={iconSize} />,
  },
  {
    value: PlayMode.Random,
    desc: "随机播放",
    icon: <RiShuffleLine size={iconSize} />,
  },
  {
    value: PlayMode.Single,
    desc: "单曲播放",
    icon: <RiRepeatOneLine size={iconSize} />,
  },
];

/** 从低到高音质排，最高为无损 */
export const audioQualitySort = [30257, 30216, 30259, 30260, 30232, 30280, 30250, 30251];

/**
 * 音质徽标的展示文案。
 *
 * **是「名称 + 音质码」，不是单独的「无损」两字** —— 设计稿播放栏的徽标
 * （第 02/03 页）与原型 `02-playlist-detail.html` 的
 * `<span class="tag tag--quality">无损 30251</span>` 逐字一致，两侧都带码。
 * 码值即 `audioQualitySort` 里的既有取值，不是这里新发明的。
 *
 * 此前播放栏只渲染「无损」/「杜比」，徽标因此比设计稿窄约 32px
 * （实测设计稿徽标宽 72）。详见 spec-lock `geometry.playbar.left.badgeLabel`。
 */
export const AUDIO_QUALITY_LABEL = {
  lossless: "无损 30251",
  dolby: "杜比 30250",
  hd: "高清 30280",
} as const;
