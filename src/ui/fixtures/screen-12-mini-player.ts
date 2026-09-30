import { PLACEHOLDER_GRADIENTS } from "./placeholder-art";

export const MINI_PLAYER_FIXTURE_NAME = "12-mini-player";

export const SCREEN_12_MINI_PLAYER_FIXTURE = {
  title: "迷你播放器与系统集成",
  lead: "主窗口收起后仍在播放：迷你窗口 / 托盘菜单 / 全局快捷键。",
  pills: ["展开回主窗口", "上一首", "播放 · 暂停", "关闭主窗口 · 保持播放", "全局快捷键 · 冲突检测"],
  sectionTitle: "迷你播放器 · 收起主窗口",
  columns: ["#", "能力", "说明 · 状态", "来源"],
  rows: [
    {
      title: "迷你播放器",
      subtitle: "360×140 独立小窗 · 收起主窗口后自动继续播放",
      status: "常驻置顶 · 可拖动",
      source: "Electron",
      placeholder: PLACEHOLDER_GRADIENTS[0],
    },
    {
      title: "托盘菜单",
      subtitle: "播放 / 暂停 · 上一首 / 下一首 · 显示主窗口 · 退出",
      status: "5 个菜单项",
      source: "main.ts",
      placeholder: PLACEHOLDER_GRADIENTS[0],
    },
    {
      title: "全局快捷键",
      subtitle: "播放暂停 · 上一首 / 下一首 · 音量 ± · 显示 / 隐藏窗口",
      status: "可整体禁用 · 2 处冲突",
      source: "shortcut.ts",
      placeholder: PLACEHOLDER_GRADIENTS[0],
    },
  ],
  track: {
    title: "「神呀，接住她的眼泪吧」",
    subtitle: "音乐区 UP · 正在播放",
    caption: "收起主窗口后自动继续 · 常驻置顶 · 可拖动",
    artPlaceholder: PLACEHOLDER_GRADIENTS[1],
  },
  trayItems: ["播放 / 暂停", "上一首", "下一首", "显示主窗口", "退出 Biu"],
  shortcutRows: [
    ["播放 / 暂停", "Ctrl + Alt + Space"],
    ["上一首 / 下一首", "Ctrl + Alt + Left / Right"],
    ["显示 / 隐藏主窗口", "Ctrl + Alt + B"],
  ],
  conflict: "冲突：Ctrl + Alt + Space 已被输入法占用（isConflict）",
  note: "迷你播放器 360×140、主窗口收起后经 BroadcastChannel 同步播放状态；托盘菜单与全局快捷键可整体禁用并标记冲突。",
  nowPlaying: {
    title: "《雨落长街》· 全专上线",
    sub: "卧室音乐计划 · 新碟 Banner",
    quality: "lossless",
    elapsedSeconds: 82,
    durationSeconds: 228,
    queueCount: 12,
    playing: false,
  },
} as const;
