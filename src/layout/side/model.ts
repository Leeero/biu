export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const SIDEBAR_MIN_WIDTH = 160;
export const SIDEBAR_MAX_WIDTH = 480;

export const getSidebarWidth = (isCollapsed: boolean, savedWidth?: number) => {
  if (isCollapsed) return SIDEBAR_COLLAPSED_WIDTH;
  return Math.min(Math.max(savedWidth ?? 200, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
};

export const getSidebarResizeResult = (startWidth: number, delta: number) => {
  const rawWidth = Math.max(SIDEBAR_COLLAPSED_WIDTH, startWidth + delta);
  const cappedWidth = Math.min(rawWidth, SIDEBAR_MAX_WIDTH);
  const isCollapsed = cappedWidth < SIDEBAR_MIN_WIDTH;

  return {
    isCollapsed,
    renderWidth: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : Math.max(SIDEBAR_MIN_WIDTH, cappedWidth),
    savedWidth: Math.max(SIDEBAR_MIN_WIDTH, cappedWidth),
  };
};
