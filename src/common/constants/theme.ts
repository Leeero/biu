import type { ConfigThemes } from "@heroui/react";

/**
 * 决策 2「主题收敛为深色单一皮肤」。
 *
 * 原先是 dark / light 两套，且 primary 可在设置里自定义。C+ 视觉稿只有一套深色皮肤，
 * 主色固定为强调色 #2997FF，因此这里只保留 dark，并去掉自定义主色。
 *
 * 为什么还留 `background` / `primary` 两个键：HeroUI 组件在挂载时会读它们做默认配色，
 * 删掉会让未包在 C+ 令牌里的组件（Modal / Popover 等）取到随机值。
 * 注意这两个值是**给 HeroUI 自己消费的兜底**，业务代码不得引用。
 *
 * 唯一主题名的出口是 `APP_THEME`，不要在别处硬写 "dark"。
 */
export const APP_THEME = "dark";

export const Themes: ConfigThemes = {
  dark: {
    extend: "dark",
    colors: {
      background: "#08080a",
      primary: "#2997ff",
    },
  },
};
