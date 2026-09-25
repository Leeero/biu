import { useNavigate } from "react-router";

import { RiListUnordered } from "@remixicon/react";

import { usePlayList } from "@/store/play-list";

/**
 * 播放栏右侧的「队列 · N」。
 *
 * `N` 是**当前播放队列的长度**（`list.length`），不是收藏或歌单数量——
 * 设计稿的 12 是队列长度，跨曲目跳转时不应该变。用 `tabular-nums` 固定数字宽度，
 * 免得队列 9 → 10 时按钮左右抖动。
 *
 * 按重构方案 §P1 第 3 条，这里从「打开播放列表抽屉」改为**导航到 `/queue` 路由页**。
 * 抽屉组件本身要到 P5 才删除，因此 P1 期间两个入口并存：
 * `/queue` 是目标形态，抽屉是过渡期的兜底，避免队列在页面做出来之前失去入口。
 */
const QueueButton = () => {
  const navigate = useNavigate();
  const count = usePlayList(s => s.list.length);

  return (
    <button
      type="button"
      aria-label={`播放队列，共 ${count} 首`}
      onClick={() => navigate("/queue")}
      className="flex h-9 flex-none items-center gap-2 rounded-[var(--biu-radius-pill)] border border-[var(--biu-glass-border)] bg-[var(--biu-surface-hover)] px-4 text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-secondary))] tabular-nums transition-colors duration-[var(--biu-duration-fast)] hover:bg-[var(--biu-surface-sunken)] hover:text-[rgb(var(--biu-text-primary))]"
    >
      <RiListUnordered size={18} />
      队列 · {count}
    </button>
  );
};

export default QueueButton;
