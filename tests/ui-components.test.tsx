import { act } from "react";
import { createRoot } from "react-dom/client";

import { afterEach, describe, expect, test, vi } from "vitest";

import { AppShell } from "@/app/shell";
import { PageHeader } from "@/ui/patterns/page-header";
import { PlaylistCard } from "@/ui/patterns/playlist-card";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLDivElement }> = [];

const render = async (node: React.ReactNode) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  await act(async () => root.render(node));
  return container;
};

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
});

describe("design system components", () => {
  test("AppShell exposes stable navigation, main content and player regions", async () => {
    const container = await render(
      <AppShell sidebar={<nav>侧栏</nav>} topbar={<div>顶栏</div>} player={<div>播放控制</div>}>
        <div>页面内容</div>
      </AppShell>,
    );

    expect(container.querySelector('a[href="#main-content"]')).toHaveTextContent("跳转到主要内容");
    expect(container.querySelector("header")).toHaveTextContent("顶栏");
    expect(container.querySelector("main#main-content")).toHaveTextContent("页面内容");
    expect(container.querySelector('section[aria-label="播放器"]')).toHaveTextContent("播放控制");
  });

  test("PageHeader exposes a semantic heading and action area", async () => {
    const container = await render(
      <PageHeader title="音乐库" description="收藏的音乐" actions={<button type="button">播放</button>} />,
    );
    expect(container.querySelector("h1")).toHaveTextContent("音乐库");
    expect(container.querySelector("p")).toHaveTextContent("收藏的音乐");
    expect(container.querySelector("button")).toHaveTextContent("播放");
  });

  test("PlaylistCard provides named keyboard buttons and keeps open/play actions separate", async () => {
    const onPress = vi.fn();
    const onPlay = vi.fn();
    const container = await render(
      <PlaylistCard
        playlist={{
          id: "favorite-folder:1",
          source: "favorite-folder",
          title: "夜晚歌单",
          trackCount: 12,
        }}
        onPress={onPress}
        onPlay={onPlay}
      />,
    );
    const openButton = container.querySelector<HTMLButtonElement>('button[aria-label="打开歌单 夜晚歌单"]');
    const playButton = container.querySelector<HTMLButtonElement>('button[aria-label="播放歌单 夜晚歌单"]');
    expect(openButton).not.toBeNull();
    expect(playButton).not.toBeNull();

    await act(async () => openButton?.click());
    expect(onPress).toHaveBeenCalledOnce();
    expect(onPlay).not.toHaveBeenCalled();

    await act(async () => playButton?.click());
    expect(onPlay).toHaveBeenCalledOnce();
    expect(onPress).toHaveBeenCalledOnce();
  });
});
