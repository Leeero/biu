import { useEffect } from "react";

import { APP_THEME } from "@/common/constants/theme";
import { useSettings } from "@/store/settings";

import { ThemeNameContext } from "./use-theme";

interface Props {
  children: React.ReactNode;
}

/** 主题名恒定，上下文值也就可以是常量——避免每次渲染都造新对象触发下游重渲染。 */
const THEME_CONTEXT_VALUE = { theme: APP_THEME } as const;

/**
 * 决策 2：主题收敛为深色单一皮肤。
 *
 * 与上一轮的差别（P1 · 主题收敛）：
 *
 * 1. 不再监听系统主题、不再有浅色分支，主题名恒为 `APP_THEME`。
 *    但 `.dark` 类**必须保留**：`app.css` 里写着
 *    `@custom-variant dark (&:is(.dark *))`，去掉它会让全部 `dark:` 工具类失效。
 *    同时显式移除 `.light`，避免开发期热更新把旧类名留在根元素上。
 * 2. 不再把设置里的 `primaryColor` / `backgroundColor` / `borderRadius` 写进
 *    `--heroui-*`。这三项的自定义入口已随本阶段移除，颜色与圆角统一由 C+ 令牌决定；
 *    继续写入会与令牌层争夺同一个变量，产生「改令牌没反应」的假象。
 * 3. 字体仍可自定义——字体不在收敛范围内。
 *
 * 旧设置文件里的 `themeMode` / `primaryColor` / `borderRadius` / `backgroundColor`
 * 仍会被 store 读取并回写（见 `store/settings.ts` 的 partialize），
 * 只是不再产生作用：满足「旧设置文件可无损读取」这条出口标准。
 */
const Theme = ({ children }: Props) => {
  const fontFamily = useSettings(s => s.fontFamily);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light");
    root.classList.add(APP_THEME);
    root.style.colorScheme = APP_THEME;

    const validFontFamily = fontFamily === "system-default" ? "system-ui" : fontFamily;
    if (validFontFamily) {
      root.style.fontFamily = validFontFamily;
    }
  }, [fontFamily]);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <ThemeNameContext value={THEME_CONTEXT_VALUE}>{children}</ThemeNameContext>
    </main>
  );
};

export default Theme;
