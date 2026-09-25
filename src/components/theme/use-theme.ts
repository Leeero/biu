import { createContext, use } from "react";

import { APP_THEME } from "@/common/constants/theme";

/**
 * 主题上下文。C+ 只有深色一套皮肤（决策 2），因此默认值就是 `APP_THEME`——
 * 默认值与运行期取值一致，任何忘记包 Provider 的地方都会拿到正确主题，
 * 而不是像上一轮那样静默落到浅色。
 */
export const ThemeNameContext = createContext<{ theme: "light" | "dark" }>({ theme: APP_THEME });

export const useTheme = () => use(ThemeNameContext);
