import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Badge, type BadgeVariant } from "@/ui/primitives/badge";

/** 本地音频格式。取值即领域里的扩展名，决定文件名颜色。 */
export type AudioFormat = "flac" | "wav" | "aiff" | "m4a" | "mp3" | "wma";

/**
 * 格式 → 文字色。每个格式一个色板条目（`--biu-fmt-*`），
 * 不是「无损 vs 有损」两档 —— 设计稿给了六种各自的颜色，就照六种来。
 * 注意 m4a 与 mp3/wma 的取值关系：mp3 与 wma **取值相同**，
 * 色板里按角色登记了两条，合并会让「改 mp3 的颜色」顺带改掉 wma。
 */
const FORMAT_COLOR: Record<AudioFormat, string> = {
  flac: "text-[rgb(var(--biu-fmt-flac))]",
  wav: "text-[rgb(var(--biu-fmt-wav))]",
  aiff: "text-[rgb(var(--biu-fmt-aiff))]",
  m4a: "text-[rgb(var(--biu-fmt-m4a))]",
  mp3: "text-[rgb(var(--biu-fmt-mp3))]",
  wma: "text-[rgb(var(--biu-fmt-wma))]",
};

interface FormatCardProps {
  format: AudioFormat;
  /** 覆盖默认的大写格式名（缺省即 `format.toUpperCase()`）。 */
  formatLabel?: ReactNode;
  /** 文件名。 */
  title: ReactNode;
  /** 元信息行：`04:15 · 38.4 MB · 创建于 2024-08-12`。 */
  meta?: ReactNode;
  /** 右上角徽标：`D 盘 · Lossless`。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  /**
   * 点亮整卡。**原型里格式卡没有任何交互**（静态稿），这是重构新增的：
   * 本地音乐条目本来可播，而格式卡没有播放键。**不新画一个播放键** ——
   * 那会改变设计稿的构图；改为整卡可点，视觉上零变化。
   * 若将来要在设计上给它一个显式入口，先改 spec-lock。
   */
  onPress?: () => void;
  className?: string;
}

/**
 * 本地格式卡（原型 `.format-card`）。
 *
 * 这是「本地音乐不做封面匹配」这个产品决策的视觉落地：载体是
 * **格式 + 文件名 + 目录**这套真实元数据，所以卡片比别的卡片更「文档感」——
 * 30px 的数字字体格式名打头，文件名次之，元信息垫底。
 *
 * 与方案 §5.2 摘要的差异：摘要按 `format / count / size / playable` 记，
 * 实际原型是 `format / title / meta / badge`（本地音乐只产出
 * title / 格式 / 大小 / 时长 / 创建时间，没有 count）。这里按原型实现。
 */
export const FormatCard = ({
  format,
  formatLabel,
  title,
  meta,
  badge,
  badgeVariant = "default",
  onPress,
  className,
}: FormatCardProps) => {
  const body = (
    <>
      <div
        className={twMerge(
          "font-[family-name:var(--biu-font-numeric)] text-[30px] leading-9 font-bold tracking-[-0.6px]",
          FORMAT_COLOR[format],
        )}
      >
        {formatLabel ?? format.toUpperCase()}
      </div>
      <div className="mt-[2px] text-[22px] leading-[30px] font-semibold tracking-[-0.3px] text-[rgb(var(--biu-text-primary))]">
        {title}
      </div>
      {meta !== undefined && meta !== null && (
        <div className="text-[length:var(--biu-type-label-size)] leading-5 text-[rgb(var(--biu-text-quaternary))]">
          {meta}
        </div>
      )}
    </>
  );

  return (
    <article
      className={twMerge(
        "relative h-[130px] rounded-[var(--biu-radius-md)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-raised)]",
        "px-7 pt-[22px] pb-5",
        className,
      )}
    >
      {badge && (
        // 原型 `.format-card .badge { left: auto; right: 16px; top: 16px }` —— 唯一一个
        // 挂在**右上**的徽标（瓦片与专辑卡都在左上）。位置是设计决策，不要顺手对齐。
        <Badge variant={badgeVariant} className="absolute top-4 right-4 z-[2]">
          {badge}
        </Badge>
      )}
      {onPress ? (
        <button
          type="button"
          onClick={onPress}
          className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--biu-accent))]"
        >
          {body}
        </button>
      ) : (
        body
      )}
    </article>
  );
};

interface FormatGridProps {
  children: ReactNode;
  /**
   * 与上一段的间距。原型 `.format-grid { margin-top: 36px }`（尾部覆盖值），
   * 比其它栅格明显更松 —— 因为格式卡上方是筛选条，需要一段静默区把
   * 「筛什么」和「筛出来的是什么」分开。
   */
  className?: string;
}

/** 格式卡栅格（原型 `.format-grid`）：2 列、间距 20、上边距 36。 */
export const FormatGrid = ({ children, className }: FormatGridProps) => (
  <div className={twMerge("mt-9 grid grid-cols-2 gap-[var(--biu-layout-grid-gap)]", className)}>{children}</div>
);
