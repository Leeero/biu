import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Artwork } from "@/ui/primitives/artwork";

interface CreatorRowProps {
  /** 创作者名。 */
  name: ReactNode;
  /** 副信息行：`48.2 万粉丝 · 音乐区 UP · 已投稿 128 个视频`。 */
  meta?: ReactNode;
  avatar?: string;
  /** 稳定占位键（通常是 UP 的 mid）。 */
  avatarKey?: string;
  followed?: boolean;
  onFollow?: () => void;
  /** 操作槽内容。缺省渲染关注按钮；传 `null` 可关掉。 */
  actions?: ReactNode;
  className?: string;
}

/**
 * 创作者行（原型 `.creator-row` / `.creator-face` / `.follow`）。
 *
 * 几何取设计稿第 7 页实测（spec-lock `geometry.creatorRow`，1.3.12），
 * **不是原型的值**。原型 `.creator-row` 被定义过两次，生效的那处是
 * `107px | 1fr | 112px`，但第一处的 `border-top` 与 `min-height: 74px` 仍然
 * 生效 —— 照原型摆出来是「74 高、带分隔线、头像 56」的行；设计稿实测是
 * 「行高 56、**无分隔线**（两行之间逐行均值 = 画布底）、头像 **40** 圆」，
 * 两行之间是纯底。逐项证据：
 *
 * - 头像 50% 交叉 x64–104（40）× y542–581 / y598–637，行距 56，头像在行内
 *   垂直居中（上下内缩各 8）。
 * - 姓名墨迹左缘 x120 = 头像右缘 104 + 16 ⇒ 网格取 `40px | 1fr | 112px` +
 *   `gap: 16px`（真值 `gridRule` 给出的两种像素等价方案之一；另一种是
 *   56px 列 + 0 间隙，此处选语义更直的那一种）。原型按 107 + 16 摆会让
 *   姓名落在 x187，与实测差 67px。
 * - 操作列左缘 x1264 = 内容右缘 1376 − 112，与 `geometry.list.col5` 同宽。
 * - 行内文本块与列表行同构：姓名 17 / 600（`--biu-type-list-title`）+
 *   6px + 副行 13，两行 `leading-none`（`geometry.list.trackText`）。
 *
 * 关注按钮是**反色的二元态**（spec-lock `material.followButton`）：
 * 未关注「关注」是**反色亮底 + 深字**（`--biu-inverse-surface` +
 * `--biu-inverse-ink`，与激活药丸同一条设计语言），已关注「已关注」是
 * 白 10% 弱底 + 亮字（`--biu-surface-hover`）—— 与原型（未关注 = 描边、
 * 已关注 = 白 12% 底）的材质相反，且两态都**无描边**、高 32
 * （`--biu-layout-follow-h`）、左右内距 16。原型 `.follow` 的
 * 「高 34 / 内距 20 / 白 22% 描边」是原型档，实现不随行。
 *
 * 按钮**水平居中于操作列的可用宽**会落到 x1264 以右 —— 实测两态按钮
 * 左缘同为 x1264（列内左对齐），宽度随文字（已关注 71 / 关注 58）。
 */
export const CreatorRow = ({
  name,
  meta,
  avatar,
  avatarKey,
  followed = false,
  onFollow,
  actions,
  className,
}: CreatorRowProps) => (
  <div
    className={twMerge(
      "grid h-[var(--biu-layout-creator-row-h)] grid-cols-[40px_minmax(0,1fr)_var(--biu-layout-creator-actions-w)] items-center gap-4",
      className,
    )}
  >
    <Artwork
      src={avatar}
      artKey={avatarKey}
      alt=""
      radius="round"
      gradient="face"
      className="h-[var(--biu-layout-creator-avatar)] w-[var(--biu-layout-creator-avatar)] flex-none"
    />

    <div className="min-w-0">
      <div className="truncate text-[length:var(--biu-type-list-title-size)] leading-none font-semibold text-[rgb(var(--biu-text-primary))]">
        {name}
      </div>
      {meta !== undefined && meta !== null && (
        <div className="mt-[6px] truncate text-[length:var(--biu-type-label-size)] leading-none text-[rgb(var(--biu-text-quaternary))]">
          {meta}
        </div>
      )}
    </div>

    {actions !== null && (
      <div className="justify-self-start">
        <button
          type="button"
          aria-pressed={followed}
          onClick={onFollow}
          className={twMerge(
            "h-[var(--biu-layout-follow-h)] cursor-pointer rounded-[var(--biu-radius-pill)] px-4",
            "text-[length:var(--biu-type-label-size)] font-medium",
            followed
              ? "border-0 bg-[var(--biu-surface-hover)] text-[rgb(var(--biu-text-secondary))]"
              : "border-0 bg-[rgb(var(--biu-inverse-surface))] text-[rgb(var(--biu-inverse-ink))]",
          )}
        >
          {followed ? "已关注" : "关注"}
        </button>
      </div>
    )}
  </div>
);
