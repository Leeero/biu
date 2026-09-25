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
 * **原型的 `.creator-row` 被定义过两次**，生效的是文件末尾那一处
 * （app.css:1957）：`107px | minmax(0,1fr) | 112px`、`padding-right: 0`。
 * 但前一处（app.css:746）设的 `border-top: 1px solid var(--line-weak)` 与
 * `gap: 16px` **没有被覆盖**，仍然生效 —— 所以这三项都要带上。
 *
 * 高度取 **74px**：前一处设 `min-height: 74px`，后一处设 `height: 56px`；
 * 两者并存时 `min-height` 更硬，实际高度就是 74px。照后一处写 56px
 * 会与设计稿差 18px，而这类「看起来像笔误其实是真的」的差值最难被发现。
 *
 * 关注按钮是**二元态**而非三种按钮：`已关注` 是描边透明、白 12% 底、
 * 四级文字（视觉上「退到背景」），`关注` 是白 22% 描边、主文字色。
 * 这样未关注态更醒目，符合「还没关注才需要被提示」。
 *
 * 关注按钮同样被原型定义过两次（app.css:762 与 1734），生效值取后者：
 * 高 **34**（不是 32）、左右内边距 **20**（不是 16）。
 *
 * 原型**没有** `.follow:hover` 规则。这里如实不加悬停底色 —— 与列表行内
 * 操作带同样的判断：原型没写的交互反馈不补，要补先改 spec-lock。
 * 可辨识性由 `aria-pressed` 与文字本身（关注 / 已关注）承担。
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
      "grid min-h-[74px] grid-cols-[107px_minmax(0,1fr)_112px] items-center gap-4",
      "border-t border-[var(--biu-border-weak)] pr-0",
      className,
    )}
  >
    <Artwork
      src={avatar}
      artKey={avatarKey}
      alt=""
      radius="round"
      gradient="face"
      className="h-[56px] w-[56px] flex-none"
    />

    <div className="min-w-0">
      <div className="truncate text-[length:var(--biu-type-body-size)] font-semibold text-[rgb(var(--biu-text-primary))]">
        {name}
      </div>
      {meta !== undefined && meta !== null && (
        <div className="mt-[6px] truncate text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
          {meta}
        </div>
      )}
    </div>

    {actions !== null && (
      <div className="justify-self-start">
        {actions ?? (
          <button
            type="button"
            aria-pressed={followed}
            onClick={onFollow}
            className={twMerge(
              "h-[34px] cursor-pointer rounded-[var(--biu-radius-pill)] border px-5",
              "text-[length:var(--biu-type-label-size)] font-medium",
              followed
                ? "border-transparent bg-[var(--biu-veil-12)] text-[rgb(var(--biu-text-quaternary))]"
                : "border-[var(--biu-veil-22)] bg-transparent text-[rgb(var(--biu-text-primary))]",
            )}
          >
            {followed ? "已关注" : "关注"}
          </button>
        )}
      </div>
    )}
  </div>
);
