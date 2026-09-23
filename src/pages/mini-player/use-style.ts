import { useEffect } from "react";

import { useSettings } from "@/store/settings";

export const useStyle = () => {
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    const rootEl: HTMLDivElement | null = document.querySelector("#root");
    if (rootEl) {
      rootEl.style.background = "rgb(var(--biu-color-surface) / 0.96)";
      rootEl.style.overflow = "hidden";
      rootEl.style.borderRadius = `${Math.max(useSettings.getState().borderRadius, 12)}px`;
      rootEl.style.border = "1px solid rgb(var(--biu-color-border) / 0.08)";
      rootEl.style.boxShadow = "var(--biu-shadow-floating)";
    }

    return () => {
      const rootEl: HTMLDivElement | null = document.querySelector("#root");
      if (rootEl) {
        document.documentElement.style.removeProperty("background");
        document.body.style.removeProperty("background");
        document.body.style.removeProperty("margin");
        document.body.style.removeProperty("overflow");
        rootEl.style.removeProperty("background");
        rootEl.style.removeProperty("overflow");
        rootEl.style.removeProperty("border-radius");
        rootEl.style.removeProperty("border");
        rootEl.style.removeProperty("box-shadow");
      }
    };
  }, []);
};
