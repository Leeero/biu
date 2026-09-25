import { useState, type CSSProperties } from "react";

import { twMerge } from "tailwind-merge";

import { PLACEHOLDER_RADIALS, pickPlaceholderGradient, type PlaceholderRadial } from "@/ui/fixtures/placeholder-art";

/** 圆角档位。`art` 是列表行内缩略图专用的 6px（`--biu-layout-art-radius`）。 */
export type ArtworkRadius = "none" | "art" | "sm" | "md" | "lg" | "round" | "pill";

const RADIUS: Record<ArtworkRadius, string> = {
  none: "rounded-[var(--biu-radius-image)]",
  art: "rounded-[var(--biu-layout-art-radius)]",
  sm: "rounded-[var(--biu-radius-sm)]",
  md: "rounded-[var(--biu-radius-md)]",
  lg: "rounded-[var(--biu-radius-lg)]",
  round: "rounded-[var(--biu-radius-round)]",
  pill: "rounded-[var(--biu-radius-pill)]",
};

interface ArtworkProps {
  /** 封面地址。缺省或加载失败时回落到占位渐变。 */
  src?: string;
  /** 稳定的占位选择键（通常是领域 ID）：同一条内容每次都要得到同一个占位色。 */
  artKey?: string;
  /** 无障碍替代文本。封面通常与标题重复，此时传空串并配 `aria-hidden`。 */
  alt: string;
  radius?: ArtworkRadius;
  /**
   * 占位样式。`linear` 是按 `artKey` 哈希**选**一条 16:9 封面渐变
   * （列表行、瓦片用）；其余取值是从夹具里**取固定的一条**，用于那些
   * 形状或语义固定的封面位：`disc` / `face` / `avatar` 是圆形的三种，
   * `heroCard` / `heroList` / `immersive` 是发现音乐大卡与沉浸态的
   * 固定底图（原型对这几处用的本就是固定渐变，不是随机选）。
   */
  gradient?: "linear" | PlaceholderRadial;
  /**
   * B 站图床的缩放参数（`672w_378h_1c.avif` 之类）。
   * 只有该图床的 URL 吃这个后缀，其他来源传了反而会 404，所以默认不拼。
   */
  params?: string;
  className?: string;
  /** 尺寸等自由样式。宽高由调用方决定（列表行内是固定 100×56，瓦片是宽高比）。 */
  style?: CSSProperties;
  /** 图片填充方式。封面默认裁切铺满。 */
  fit?: "cover" | "contain";
}

/**
 * 封面 / 头像位。
 *
 * 三件事必须在这里一次做对，否则每个页面都要各错一遍：
 *   1. **占位是确定性的**：按 `artKey` 哈希选渐变，不用随机数。
 *      随机占位会让列表每次重排都换色，既刺眼，也让截图比对失去意义。
 *   2. **加载失败要回落**：B 站封面有防盗链与失效两种情况，`onError` 后
 *      隐藏 `<img>` 让底下的占位渐变露出来，而不是留一个破图图标。
 *   3. **占位值来自夹具模块**，不是写死在组件里 —— 它是数据不是设计令牌，
 *      取值与约束见 src/ui/fixtures/placeholder-art.ts。
 */
export const Artwork = ({
  src,
  artKey,
  alt,
  radius = "md",
  gradient = "linear",
  params,
  className,
  style,
  fit = "cover",
}: ArtworkProps) => {
  const [failed, setFailed] = useState(false);

  const background = gradient === "linear" ? pickPlaceholderGradient(artKey) : PLACEHOLDER_RADIALS[gradient];
  const resolved = src ? (params ? `${src}@${params}` : src) : undefined;
  const showImage = Boolean(resolved) && !failed;

  return (
    <span
      className={twMerge("relative block overflow-hidden bg-[var(--biu-surface-art-bed)]", RADIUS[radius], className)}
      style={{ ...style, backgroundImage: showImage ? undefined : background }}
    >
      {showImage && (
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={twMerge("size-full", fit === "cover" ? "object-cover" : "object-contain")}
        />
      )}
    </span>
  );
};
