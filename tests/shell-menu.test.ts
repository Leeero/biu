import type { MenuItemConstructorOptions } from "electron";

import { describe, expect, test, vi } from "vitest";

import { buildShellMenuTemplate, type ShellMenuActions } from "../electron/windows/shell-menu";

const createActions = (): ShellMenuActions => ({
  onTogglePlay: vi.fn(),
  onPrev: vi.fn(),
  onNext: vi.fn(),
  onVolumeUp: vi.fn(),
  onVolumeDown: vi.fn(),
  onToggleMute: vi.fn(),
  onFavorite: vi.fn(),
  onToggleMiniMode: vi.fn(),
  onToggleMainWindow: vi.fn(),
  onOpenSettings: vi.fn(),
  onQuit: vi.fn(),
});

const findItem = (template: MenuItemConstructorOptions[], label: string) => {
  const item = template.find(entry => entry.label === label);
  if (!item) throw new Error(`menu item not found: ${label}`);
  return item;
};

const idleStatus: PlayerStatusSnapshot = { isPlaying: false, isMuted: false, volume: 0.5 };
const playingStatus: PlayerStatusSnapshot = {
  isPlaying: true,
  isMuted: true,
  volume: 0.3,
  title: "夜曲",
  artist: "周杰伦",
};

describe("菜单栏/托盘菜单模板", () => {
  test("未播放：首行提示未在播放，播放项是「播放」，收藏入口禁用", () => {
    const template = buildShellMenuTemplate(idleStatus, createActions());

    expect(template[0].label).toBe("未在播放");
    expect(template[0].enabled).toBe(false);
    expect(findItem(template, "播放").label).toBe("播放");
    expect(findItem(template, "收藏当前歌曲…").enabled).toBe(false);
    expect(findItem(template, "静音").checked).toBe(false);
  });

  test("播放中：首行显示「歌名 - 作者」，播放项变为「暂停」，静音项勾选", () => {
    const template = buildShellMenuTemplate(playingStatus, createActions());

    expect(template[0].label).toBe("夜曲 - 周杰伦");
    expect(findItem(template, "暂停")).toBeTruthy();
    expect(template.some(entry => entry.label === "播放")).toBe(false);
    expect(findItem(template, "静音").checked).toBe(true);
    expect(findItem(template, "收藏当前歌曲…").enabled).toBe(true);
  });

  test("没有作者时首行只显示歌名", () => {
    const template = buildShellMenuTemplate(
      { ...playingStatus, title: "只有标题", artist: undefined },
      createActions(),
    );

    expect(template[0].label).toBe("只有标题");
  });

  test("超长歌名被截断，避免菜单被撑爆", () => {
    const longTitle = "这是一首名字特别特别特别特别特别特别特别特别特别长的歌曲标题用来验证截断逻辑";
    expect(longTitle.length).toBeGreaterThan(32);

    const template = buildShellMenuTemplate({ ...playingStatus, title: longTitle, artist: undefined }, createActions());

    const label = String(template[0].label);
    expect(label.endsWith("…")).toBe(true);
    expect(label.length).toBeLessThanOrEqual(32);
  });

  test("每一项都接到对应动作上", () => {
    const actions = createActions();
    const template = buildShellMenuTemplate(playingStatus, actions);

    template.forEach(item => {
      // Electron 的 click 签名是 (menuItem, browserWindow, event)，测试里只验证接线
      if (typeof item.click === "function") (item.click as () => void)();
    });

    expect(actions.onTogglePlay).toHaveBeenCalledTimes(1);
    expect(actions.onPrev).toHaveBeenCalledTimes(1);
    expect(actions.onNext).toHaveBeenCalledTimes(1);
    expect(actions.onVolumeUp).toHaveBeenCalledTimes(1);
    expect(actions.onVolumeDown).toHaveBeenCalledTimes(1);
    expect(actions.onToggleMute).toHaveBeenCalledTimes(1);
    expect(actions.onFavorite).toHaveBeenCalledTimes(1);
    expect(actions.onToggleMiniMode).toHaveBeenCalledTimes(1);
    expect(actions.onToggleMainWindow).toHaveBeenCalledTimes(1);
    expect(actions.onOpenSettings).toHaveBeenCalledTimes(1);
    expect(actions.onQuit).toHaveBeenCalledTimes(1);
  });

  test("菜单分组与顺序固定（分组遍历所有可点项时的基线）", () => {
    const template = buildShellMenuTemplate(playingStatus, createActions());
    const labels = template.filter(entry => entry.type !== "separator").map(entry => entry.label);

    expect(labels).toEqual([
      "夜曲 - 周杰伦",
      "暂停",
      "上一曲",
      "下一曲",
      "增大音量",
      "减小音量",
      "静音",
      "收藏当前歌曲…",
      "迷你播放器",
      "显示/隐藏主界面",
      "设置…",
      "退出 Biu",
    ]);
  });
});
