import type { TrackActionSpec } from "@/ui/patterns/track-table";

/**
 * 屏 08 曲目行内操作带的动作（设计稿第 9 页 `.track-actions`）：
 *   播放 / 下一首 / 入队 / 收藏 / 下载音频 —— **五枚并列，没有主操作档**。
 *
 * 与屏 01（瓦片带）、屏 02（行内带）是**同一组五个**，顺序与图标都相同。设计稿把
 * 这三处画成了同一个构件，所以重复是设计本身的性质，不是抄漏了。
 *
 * **为什么仍各屏一份、不做成共享常量**：这三份描述的是**三张不同的稿页**，而每一份
 * 都是「该页实测到什么」的存档。合并成一个常量之后，「某一屏的动作集合变了」就只能
 * 靠读注释里的页号来区分，而这正是本项目在别处（色板「同值不同角色分两次登记」）
 * 明确拒绝的做法。真正的跨屏复用点在下游 —— 三屏的 `onRowAction` 都落到
 * `features/track/actions` 的同一批能力上。
 *
 * 两处**不随原型**（沿用屏 01 / 02 的勘定结论，spec-lock `material.rowActionBand`）：
 *   1. 原型的 `.round--lead`（38px 反色主操作圆片）在设计稿里没有 —— 五枚等大、
 *      同为玻璃圆片，故 `play` 只是普通一枚，不走 `primary` 槽位。
 *   2. 原型带内第一枚是「上一首」，设计稿**没有**（本页实测第二枚是「下一首」）。
 *      上一首只在播放栏的传输控件上。
 *
 * 带子的几何（五枚等大、间距 8、内边距 4×8、无分隔线）不在本文件里 —— 它是
 * `material.rowActionBand`，由 `TrackTableActions` 承担。
 */
export const DISCOVER_LIST_TRACK_ACTIONS: readonly TrackActionSpec[] = [
  { key: "play", label: "播放", icon: "play" },
  { key: "play-next", label: "下一首", icon: "next" },
  { key: "queue-add", label: "入队", icon: "queue-add" },
  { key: "favorite", label: "收藏", icon: "heart" },
  { key: "download-audio", label: "下载音频", icon: "download" },
] as const;
