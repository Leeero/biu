import type { CSSProperties, ReactNode } from "react";

import { Modal, ModalContent } from "@heroui/react";
import { twMerge } from "tailwind-merge";

interface DialogContentProps {
  title: ReactNode;
  sub?: ReactNode;
  lines?: readonly ReactNode[];
  footer?: ReactNode;
}

/**
 * 弹层内容（标题 / 说明 / 正文行 / 右下操作）。
 *
 * 弹出态（`Dialog`，包 HeroUI Modal）与静态态（`DialogStatic`，夹具按设计稿
 * 静态位渲染）共用同一份标记 —— 两处各写一遍迟早会分叉，而弹层的文案与
 * 间距正是比对要对的东西。右下操作用绝对定位，故调用方的容器必须 `relative`。
 */
const DialogContent = ({ title, sub, lines, footer }: DialogContentProps) => (
  <>
    <h2 className="m-0 text-[length:var(--biu-type-small-size)] leading-6 font-semibold text-[rgb(var(--biu-text-primary))]">
      {title}
    </h2>

    {sub !== undefined && sub !== null && (
      <p className="m-0 mt-1 text-[length:var(--biu-type-label-size)] leading-[21px] text-[rgb(var(--biu-text-quaternary))]">
        {sub}
      </p>
    )}

    {lines?.map((line, index) => (
      <p
        key={index}
        className="m-0 mt-[5px] text-[length:var(--biu-type-label-size)] leading-[21px] text-[rgb(var(--biu-text-secondary))]"
      >
        {line}
      </p>
    ))}

    {footer && <div className="absolute right-6 bottom-5 flex items-center gap-2">{footer}</div>}
  </>
);

/** 弹层材质四项（原型 `.modal`）。弹出态与静态态共用，避免材质分叉。 */
const DIALOG_SURFACE = [
  "w-[var(--biu-layout-dialog-w)] max-w-[var(--biu-layout-dialog-w)]",
  "h-[var(--biu-layout-dialog-h)] overflow-hidden rounded-[var(--biu-radius-lg)]",
  "border border-[var(--biu-veil-14)] bg-[var(--biu-surface-modal)]",
  "backdrop-blur-[var(--biu-blur-modal)] shadow-[var(--biu-shadow-modal)]",
].join(" ");

interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 标题。也是弹层的无障碍名称来源（走 `aria-label`）。 */
  title: ReactNode;
  /** 标题下方的说明（原型 `.modal-sub`）。 */
  sub?: ReactNode;
  /** 正文行（原型 `.modal-line`）：音质 / 范围之类的一行一个选项。 */
  lines?: readonly ReactNode[];
  /** 右下角操作（原型 `.modal-foot`）。 */
  footer?: ReactNode;
  /** 点遮罩可否关闭。默认可关。 */
  isDismissable?: boolean;
  className?: string;
}

/**
 * 浮动弹层（原型 `.modal` / `.modal--download`）。
 *
 * 底座用 HeroUI `Modal`：焦点陷阱、`Esc` 关闭、`aria-modal`、
 * 背景滚动锁定这些都不是自己写能写对的，方案 §5.4 也明确「`Dialog` 包装 HeroUI Modal」。
 * 但**外观全部换成 C+ 材质**，不用 HeroUI 的玻璃与圆角：
 *
 *   原型            值                        令牌
 *   底              深灰 86%                  --biu-surface-modal
 *   描边            白 14%                    --biu-veil-14
 *   模糊            28px（不是 20）           --biu-blur-modal
 *   投影            0 24px 60px 黑 50%        --biu-shadow-modal
 *   圆角            20                        --biu-radius-lg
 *   几何            560 × 153                  --biu-layout-dialog-w / -h
 *
 * 六项里有四项与玻璃材质（16% 白 / 18% 描边 / 20 模糊）**不同**。
 * 看到「有描边 + 有模糊」就当成玻璃去套，弹层会比设计稿亮一档、也不够「浮」。
 *
 * 固定 560 × 153 是设计决策：这个弹层的内容是「两行选项 + 一个操作」，
 * 高度写死才能让它在不同内容下保持同一个体量。内容超长时由调用方
 * 自己决定截断或改用别的容器 —— 让高度自适应就等于放弃了这条设计约束。
 *
 * 关于 `aria-label`：视觉标题用普通 `<h2>` 渲染，无障碍名称显式走 `aria-label`，
 * 不依赖 HeroUI 的 header 插槽自动连线。原因是这里的标题/说明/正文行
 * 不像「弹层标题 + 弹层正文」那种标准结构（正文行其实是**选项**），
 * 走插槽会自动套上两段式布局，反而要写更多覆盖。
 */
export const Dialog = ({
  isOpen,
  onOpenChange,
  title,
  sub,
  lines,
  footer,
  isDismissable = true,
  className,
}: DialogProps) => (
  <Modal
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    hideCloseButton
    isDismissable={isDismissable}
    // HeroUI 自带的尺寸/圆角/阴影一律关掉，几何与材质全部由下面几行给。
    size="5xl"
    radius="none"
    shadow="none"
    // 原型没有关闭按钮（`.modal` 里没有 ×），关掉后 Esc 与点遮罩仍然有效。
    classNames={{
      wrapper: "items-center",
      base: twMerge(
        "m-0 w-[var(--biu-layout-dialog-w)] max-w-[var(--biu-layout-dialog-w)]",
        "h-[var(--biu-layout-dialog-h)] overflow-hidden rounded-[var(--biu-radius-lg)]",
        "border border-[var(--biu-veil-14)] bg-[var(--biu-surface-modal)]",
        "backdrop-blur-[var(--biu-blur-modal)] shadow-[var(--biu-shadow-modal)]",
        className,
      ),
      backdrop: "bg-[var(--biu-scrim)] backdrop-blur-none",
    }}
    aria-label={typeof title === "string" ? title : undefined}
  >
    <ModalContent className="relative px-6 pt-[17px] pb-5">
      <DialogContent title={title} sub={sub} lines={lines} footer={footer} />
    </ModalContent>
  </Modal>
);

interface DialogStaticProps extends DialogContentProps {
  /** 静态位（相对壳层 `<main>`）。设计稿 `.modal--download` 为 left 752 / top 225。 */
  style?: CSSProperties;
  className?: string;
}

/**
 * 静态弹层：与 `Dialog` 同材质、同内容，但不挂 HeroUI Modal（无遮罩、无焦点陷阱）。
 *
 * 只给设计稿比对用。设计稿把下载弹层**画**在页面上（浮动在内容之上），
 * 而交互态下它只有点了「批量下载音频」才出现 —— 夹具要复现设计稿画面，
 * 就必须能把它静态地摆在画布上。
 *
 * 定位上下文是壳层 `<main>`（与注解带相同），坐标沿用设计稿画布 y。
 */
export const DialogStatic = ({ style, className, ...content }: DialogStaticProps) => (
  <div
    aria-hidden="true"
    className={twMerge(
      "pointer-events-none absolute z-[var(--biu-z-note)] px-6 pt-[17px] pb-5",
      DIALOG_SURFACE,
      className,
    )}
    style={style}
  >
    <DialogContent {...content} />
  </div>
);

interface DialogActionProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}

/**
 * 弹层里的主操作（原型 `.btn-accent`）：高 36、左右内边距 20、药丸圆角、
 * 强调色底、白字、13px / 600。
 *
 * 不复用 `Pill`：药丸是筛选条里的一档选中态（高 36 但底色语义完全不同，
 * 且带 `aria-pressed`）。这两个东西的几何像，语义不像 —— 用同一个组件
 * 会逼着其中一边接受多余的属性。
 */
export const DialogAction = ({ children, onPress, className }: DialogActionProps) => (
  <button
    type="button"
    onClick={onPress}
    className={twMerge(
      "inline-flex h-9 cursor-pointer items-center rounded-[var(--biu-radius-pill)] px-5",
      "bg-[rgb(var(--biu-accent))] text-[length:var(--biu-type-label-size)] font-semibold",
      "text-[rgb(var(--biu-text-primary))]",
      className,
    )}
  >
    {children}
  </button>
);
