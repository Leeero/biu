import { twMerge } from "tailwind-merge";

import { Artwork } from "@/ui/primitives/artwork";

interface AvatarProps {
  src?: string;
  /** 用户 / 创作者 ID，用于稳定占位。 */
  artKey?: string;
  /**
   * 无障碍名称。头像本身只是装饰（旁边已有名字）时传空串，
   * 让读屏跳过它，而不是把用户名念两遍。
   */
  alt: string;
  /** 直径像素。原型：顶栏头像 40、创作者行 / 搜索创作者行 56、碟片缩略图 56。 */
  size?: number;
  className?: string;
}

/**
 * 圆形头像。
 *
 * 是 `Artwork` 的圆形特例：占位用 `.creator-face` 的径向渐变。
 * 直径必传或取默认值，**不吃父级尺寸** —— 头像被拉伸成椭圆是很常见的返工项。
 */
export const Avatar = ({ src, artKey, alt, size = 40, className }: AvatarProps) => (
  <Artwork
    src={src}
    artKey={artKey}
    alt={alt}
    radius="round"
    gradient="face"
    className={twMerge("shrink-0", className)}
    style={{ width: size, height: size }}
  />
);
