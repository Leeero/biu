import type { TrackActionSpec } from "@/ui/patterns/track-table";

/**
 * 屏 02 曲目行内操作带的动作（设计稿第 3 页 `.track-actions`）：
 *   播放 / 下一首 / 入队 / 收藏 / 下载音频 —— **五枚并列，没有主操作档**。
 *
 * 与屏 01 瓦片操作带（`LIBRARY_TILE_ACTIONS`）是**同一组五个**，顺序也相同。
 * 这不奇怪：设计稿第 2 页的瓦片带与第 3 页的行内带被画成了同一个构件
 * （五枚等大 34px 圆片、无分隔线、无层级），只有几何与位置不同。
 *
 * 两处**不随原型**的地方（原型—设计稿分歧，见 spec-lock `material.rowActionBand`）：
 *   1. 原型把播放拆成 `.round--lead`（38px 反色圆片），设计稿里它和其余四枚一样大、
 *      一样是玻璃圆片 —— 所以这里 `play` 只是一个普通动作，不再走 `primary` 槽位。
 *   2. 原型有「上一首」，设计稿**没有**（实测第二枚是「下一首」）。带内不再放上一首；
 *      上一首仍在播放栏的传输控件上。
 */
export const PLAYLIST_DETAIL_TRACK_ACTIONS: readonly TrackActionSpec[] = [
  { key: "play", label: "播放", icon: "play" },
  { key: "play-next", label: "下一首", icon: "next" },
  { key: "queue-add", label: "入队", icon: "queue-add" },
  { key: "favorite", label: "收藏", icon: "heart" },
  { key: "download-audio", label: "下载音频", icon: "download" },
] as const;
