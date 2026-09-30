import { useNavigate } from "react-router";

import { useNowPlaying } from "@/features/player/now-playing";
import { Button } from "@/ui/primitives/button";

/**
 * 播放栏右侧的「队列 · N」药丸。
 *
 * `N` 是**当前播放队列的长度**，不是收藏或歌单数量 —— 设计稿的 12 是队列长度，
 * 跨曲目跳转时不应该变。用 `tabular-nums` 固定数字宽度，免得队列 9 → 10 时按钮左右抖动。
 *
 * 材质与几何取自 spec-lock `material.playbar` / `geometry.playbar.right`（1.3.9 补录）：
 *   · 底 白 **10%**、**无描边** —— 设计稿实测药丸底的三通道是 38/38/41 ⇒ 9.9%，且上下缘
 *     两行（0.086 / 0.091）与底（0.099）无差别 ⇒ 没有可见描边。原型 `.pb-queue`
 *     的白 14% 底 + 12% 描边是原型档；**原实现用的 18% 描边（`--biu-glass-border`）
 *     与设计稿不符**，本轮改正。
 *   · 高 36（`--biu-layout-pill-h`）、左右内距 16、图标与文字间隔 8、13px。
 *   · **不带图标** —— 设计稿的药丸只有文字。原型 `.pb-queue` 里的 `svg.i` 列表图标
 *     未被设计稿采用（实测药丸宽 89 = 内距 16 + 文字 62 + 内距 15，容不下 15px 图标 + 8px 间隔）。
 *
 * 材质走 `Button` 的 `ghost` 变体而不是自己拼 class：同一个样子只允许有一处描述，
 * 否则「筛选条里的药丸」和「播放栏的药丸」迟早会漂成两种样子。
 *
 * 按重构方案 §P1 第 3 条，这里从「打开播放列表抽屉」改为**导航到 `/queue` 路由页**。
 * 抽屉组件本身要到 P5 才删除，因此 P1 期间两个入口并存。
 */
const QueueButton = () => {
  const navigate = useNavigate();
  const { queueCount } = useNowPlaying();

  return (
    <Button
      aria-label={`播放队列，共 ${queueCount} 首`}
      variant="ghost"
      onClick={() => navigate("/queue")}
      className="min-w-[104px] gap-[var(--biu-playbar-pill-gap)] px-[var(--biu-playbar-pill-pad)] tabular-nums"
    >
      队列 · {queueCount}
    </Button>
  );
};

export default QueueButton;
