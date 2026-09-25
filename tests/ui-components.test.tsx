import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";

import { HeroUIProvider } from "@heroui/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AppShell } from "@/app/shell";
import SegmentNav from "@/layout/topbar/segment-nav";
import {
  DEFAULT_COVER_GRADIENT,
  PLACEHOLDER_GRADIENTS,
  PLACEHOLDER_RADIALS,
  pickPlaceholderGradient,
} from "@/ui/fixtures/placeholder-art";
import { CreatorRow } from "@/ui/patterns/creator-row";
import { Dialog, DialogAction } from "@/ui/patterns/dialog";
import { InlineProgress } from "@/ui/patterns/inline-progress";
import { LyricsPanel } from "@/ui/patterns/lyrics-panel";
import { MediaTile, type TileActionSpec } from "@/ui/patterns/media-tile";
import { PageHeader } from "@/ui/patterns/page-header";
import { PlaylistCard } from "@/ui/patterns/playlist-card";
import {
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
  type TrackActionSpec,
} from "@/ui/patterns/track-table";
import { Artwork } from "@/ui/primitives/artwork";
import { Button } from "@/ui/primitives/button";
import { GlassButton } from "@/ui/primitives/glass-button";
import { KbdRow } from "@/ui/primitives/kbd-row";
import { ProgressBar } from "@/ui/primitives/progress-bar";
import { SegmentedControl } from "@/ui/primitives/segmented-control";
import { TopBarSearch } from "@/ui/primitives/topbar-search";

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

/* ------------------------------------------------------------------ 占位数据 */

const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/placeholder-art.json");

describe("占位素材是数据、且与夹具逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
    gradients: string[];
    default: string;
    radialVariants: string[];
  };

  test("封面渐变清单与 fixtures/placeholder-art.json 一致（顺序也一致）", () => {
    expect([...PLACEHOLDER_GRADIENTS]).toEqual(fixture.gradients);
    expect(DEFAULT_COVER_GRADIENT).toBe(fixture.default);
  });

  test("圆形 / 固定底图取值都出现在夹具的 radialVariants 里", () => {
    for (const value of Object.values(PLACEHOLDER_RADIALS)) {
      expect(fixture.radialVariants, `${value} 不在夹具里`).toContain(value);
    }
  });

  test("pickPlaceholderGradient 是确定性的：同键同色，且必定落在清单内", () => {
    for (const key of ["t1", "bilibili-video:123", "creator-1", "本地目录"]) {
      const first = pickPlaceholderGradient(key);
      expect(first).toBe(pickPlaceholderGradient(key));
      expect([...PLACEHOLDER_GRADIENTS]).toContain(first);
    }
    // 不同键应当能分散到不同渐变（不是恒定返回第一条）
    const spread = new Set(["a", "b", "c", "d", "e", "f", "g"].map(key => pickPlaceholderGradient(key)));
    expect(spread.size).toBeGreaterThan(1);
  });

  test("缺省键回落到默认封面，而不是随机取一条", () => {
    expect(pickPlaceholderGradient(undefined)).toBe(DEFAULT_COVER_GRADIENT);
    expect(pickPlaceholderGradient("")).toBe(DEFAULT_COVER_GRADIENT);
  });
});

/* ---------------------------------------------------------------- 可访问名称 */

describe("基础件的可访问名称", () => {
  test("圆片按钮必须携带 aria-label —— 它没有可见文字", async () => {
    const container = await render(
      <>
        <GlassButton label="播放" icon="play" />
        <GlassButton label="下载音频" icon="download" />
      </>,
    );
    expect(container.querySelector('button[aria-label="播放"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="下载音频"]')).not.toBeNull();
  });

  test("加载态按钮暴露 aria-busy 且不可重复触发", async () => {
    const onPress = vi.fn();
    const container = await render(
      <>
        <Button loading onClick={onPress}>
          加入队列
        </Button>
        <Button>加入队列</Button>
      </>,
    );
    const [busy, idle] = Array.from(container.querySelectorAll("button"));
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeDisabled();
    expect(idle).not.toHaveAttribute("aria-busy");
  });

  test("进度条给出 progressbar 语义与当前值，并在越界时夹紧", async () => {
    const container = await render(
      <>
        <ProgressBar value={0.62} label="下载进度" />
        <ProgressBar value={1.4} label="越界进度" />
        <ProgressBar value={-1} label="负值进度" />
      </>,
    );
    const bars = Array.from(container.querySelectorAll('[role="progressbar"]'));
    expect(bars.map(bar => bar.getAttribute("aria-valuenow"))).toEqual(["62", "100", "0"]);
    expect(bars[0]).toHaveAttribute("aria-label", "下载进度");
    expect(bars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(bars[0]).toHaveAttribute("aria-valuemax", "100");
  });

  test("快捷键行的 dt/dd 必须包在 dl 里（否则是无效 HTML，辅助技术会乱）", async () => {
    const container = await render(<KbdRow label="播放 / 暂停" keys="Space" />);
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    expect(dl?.querySelector("dt")).toHaveTextContent("播放 / 暂停");
    expect(dl?.querySelector("dd")).toHaveTextContent("Space");
    expect(dl?.querySelector("dt")?.parentElement?.tagName).toBe("DL");
  });

  test("封面加载失败后回落到占位，不留破图", async () => {
    const container = await render(<Artwork src="https://example.invalid/a.jpg" alt="" artKey="x" radius="art" />);
    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    await act(async () => {
      image?.dispatchEvent(new Event("error"));
    });
    expect(container.querySelector("img")).toBeNull();
  });

  test("顶栏搜索位把根节点交给调用方：点输入框外面关浮层要用整个搜索位的边界", async () => {
    const rootRef = { current: null as HTMLDivElement | null };
    const container = await render(<TopBarSearch rootRef={rootRef} value="" onValueChange={() => undefined} />);

    expect(rootRef.current).not.toBeNull();
    expect(rootRef.current).toBe(container.firstElementChild);
    // 输入框必须在这个根节点**里面** —— 否则「点在不在搜索位内」永远为假。
    expect(rootRef.current?.querySelector("input")).not.toBeNull();
    // 设计稿画了 Ctrl K 提示，提示可见就必须可用，所以默认渲染它。
    expect(container.textContent).toContain("Ctrl K");
  });
});

/* ---------------------------------------------------------------- 键盘路径 */

// HeroUI 的 Modal 走 portal 挂到 document.body，不在 render 返回的容器里。
// 因此弹层类断言一律查 body —— 查容器会「看起来没渲染」，其实是查错了地方。
const openDialog = async (node: React.ReactElement) => render(<HeroUIProvider>{node}</HeroUIProvider>);

describe("键盘路径", () => {
  test("分段控件（模式切换形态）：不给 panelId 时退化为按钮组，方向键移动选中项", async () => {
    const onSelect = vi.fn();
    const items = [
      { key: "cover", label: "封面" },
      { key: "lyrics", label: "歌词" },
      { key: "video", label: "视频" },
    ];
    const container = await render(
      <SegmentedControl label="显示模式" items={items} activeKey="cover" onSelect={onSelect} />,
    );

    // 没有真实面板时不得冒充 tab —— role=tab 承诺「控制某个面板」，那是兑现不了的。
    const group = container.querySelector('[role="group"][aria-label="显示模式"]');
    expect(group).not.toBeNull();
    expect(container.querySelector('[role="tablist"]')).toBeNull();

    const [first] = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    expect(first).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      first?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith("lyrics");
  });

  test("分段控件（标签页形态）：给了 panelId 才用 tab 语义，并声明 aria-controls", async () => {
    const container = await render(
      <SegmentedControl
        label="详情分区"
        panelId="detail-panel"
        activeKey="a"
        onSelect={() => undefined}
        items={[
          { key: "a", label: "简介" },
          { key: "b", label: "曲目" },
        ]}
      />,
    );
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    const tab = container.querySelector('[role="tab"]');
    expect(tab).toHaveAttribute("aria-controls", "detail-panel");
    expect(tab).toHaveAttribute("aria-selected", "true");
    // 未激活项不参与 Tab 停留（roving tabindex）
    expect(container.querySelectorAll('[role="tab"]')[1]).toHaveAttribute("tabindex", "-1");
  });

  test("分段控件（已声明待接线）：渲染为不可交互元素，不是点了没反应的按钮，也不置灰", async () => {
    // 导航型分段渲染成 <Link>，需要路由上下文 —— 断言的是它真的渲染成了链接。
    const container = await render(
      <MemoryRouter>
        <SegmentedControl
          label="顶栏分段导航"
          activeKey="/library"
          items={[
            { key: "/library", label: "我的音乐库", href: "/library" },
            { key: "我收藏的", label: "我收藏的", pending: true },
          ]}
        />
      </MemoryRouter>,
    );
    // 导航型仍在（有 href），整体仍是 <nav>
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelector('a[href="/library"]')).not.toBeNull();
    // 待接线项：不可交互，但**不置灰** —— 原型里没有「未接线」这一态，置灰是发明。
    const pending = container.querySelector('[aria-disabled="true"]');
    expect(pending).not.toBeNull();
    expect(pending).toHaveTextContent("我收藏的");
    expect(pending?.tagName).toBe("SPAN");
    expect(pending?.className).not.toContain("opacity-40");
    // 组内不应再多出一个按钮：它就是那个「点了没反应」的假控件。
    expect(Array.from(container.querySelectorAll("button"))).toHaveLength(0);
  });

  test("轨道行：重排行只在给了 position 时可拖，且不给行加 tabIndex", async () => {
    const container = await render(
      <TrackTable onReorder={() => undefined}>
        <TrackTableRow trackId="a" position={0}>
          <TrackIndex value={1} />
        </TrackTableRow>
        <TrackTableRow trackId="b">
          <TrackIndex value={2} />
        </TrackTableRow>
      </TrackTable>,
    );
    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-current], div")).filter(el =>
      el.className.includes("grid"),
    );
    expect(rows[0]).toHaveAttribute("draggable", "true");
    expect(rows[1]).not.toHaveAttribute("draggable");
    // 200 行列表若有 200 个 Tab 停留点，键盘用户会被困住 —— 行本身不进 Tab 序列。
    for (const row of rows) expect(row).not.toHaveAttribute("tabindex");
  });
});

/* ---------------------------------------------------------------- 模式件 */

describe("轨道表", () => {
  const rows = (
    <>
      <TrackTableRow trackId="t1">
        <TrackIndex value={1} />
        <TrackMain>
          <TrackText title="第一首" subtitle="音乐综合" />
        </TrackMain>
        <TrackCell>收藏于 09-21</TrackCell>
        <TrackCell align="end">03:18</TrackCell>
      </TrackTableRow>
      <TrackTableRow trackId="t2">
        <TrackIndex value={2} />
        <TrackMain>
          <TrackText title="第二首" subtitle="原创音乐" />
        </TrackMain>
        <TrackCell>收藏于 09-18</TrackCell>
        <TrackCell align="end">02:47</TrackCell>
      </TrackTableRow>
    </>
  );

  test("表头列渲染出来，未传 columns 时不渲染表头（第 06 屏搜索结果就是这个形态）", async () => {
    const withHead = await render(
      <TrackTable
        columns={[
          { key: "no", label: "#" },
          { key: "content", label: "内容" },
          { key: "saved", label: "收藏于 · 分P" },
          { key: "dur", label: "时长", align: "end" },
        ]}
      >
        {rows}
      </TrackTable>,
    );
    const head = withHead.firstElementChild?.firstElementChild;
    expect(head).toHaveTextContent("收藏于 · 分P");
    expect(head?.lastElementChild).toHaveClass("text-right");

    const withoutHead = await render(<TrackTable variant="search">{rows}</TrackTable>);
    expect(withoutHead.textContent).not.toContain("收藏于 · 分P");
  });

  test("currentId 只命中 trackId 相等的那一行", async () => {
    const container = await render(<TrackTable currentId="t2">{rows}</TrackTable>);
    const marked = container.querySelectorAll("[data-current]");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("第二首");
  });

  test("行内操作带的每个圆片都有名称，且不占 grid 列（绝对定位）", async () => {
    const actions: TrackActionSpec[] = [{ key: "heart", label: "收藏", icon: "heart" }];
    const container = await render(
      <TrackTable>
        <TrackTableRow trackId="t1">
          <TrackIndex value={1} />
          <TrackTableActions primary={{ key: "play", label: "播放", icon: "play" }} actions={actions} />
        </TrackTableRow>
      </TrackTable>,
    );
    expect(container.querySelector('button[aria-label="播放"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="收藏"]')).not.toBeNull();
    const band = container.querySelector('button[aria-label="播放"]')?.parentElement;
    expect(band?.className).toContain("absolute");
  });

  test("行脱离表格单独渲染也能拿到合法列模板（不静默退化成单列）", async () => {
    const container = await render(
      <TrackTableRow trackId="solo">
        <TrackIndex value={1} />
      </TrackTableRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.gridTemplateColumns).toContain("minmax(0, 1fr)");
  });
});

describe("瓦片、歌词、进度、创作者行", () => {
  test("瓦片：当前项挂 aria-current 且操作带常驻；默认态操作带不露出", async () => {
    const actions: TileActionSpec[] = [{ key: "heart", label: "收藏", icon: "heart" }];
    const container = await render(
      <>
        <MediaTile title="当前项" current actions={actions} artKey="a" />
        <MediaTile title="默认项" actions={actions} artKey="b" />
      </>,
    );
    const [current, plain] = Array.from(container.querySelectorAll("article"));
    expect(current).toHaveAttribute("aria-current", "true");
    expect(plain).not.toHaveAttribute("aria-current");
    const bandOf = (tile: Element | undefined) => tile?.querySelector<HTMLElement>('[class*="opacity"]');
    expect(bandOf(current)?.className).toContain("opacity-100");
    expect(bandOf(plain)?.className).toContain("opacity-0");
    // 原型用「露出操作带」表达选中，没有描边/发光 —— 不发明设计稿里没有的状态。
    expect(current?.className).not.toContain("ring");
  });

  test("歌词：不传 onSeek 时是纯文本，传了才是可点按钮", async () => {
    const lines = ["第一行", "第二行", "第三行"];

    const readOnly = await render(<LyricsPanel lines={lines} currentIndex={1} />);
    expect(readOnly.querySelectorAll("button")).toHaveLength(0);
    expect(Array.from(readOnly.querySelectorAll("p")).map(p => p.textContent)).toEqual(lines);

    const onSeek = vi.fn();
    const seekable = await render(<LyricsPanel lines={lines} currentIndex={1} onSeek={onSeek} />);
    const buttons = Array.from(seekable.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons).toHaveLength(3);
    expect(buttons[1]).toHaveAttribute("aria-current", "true");
    await act(async () => buttons[2]?.click());
    expect(onSeek).toHaveBeenCalledWith(2);
  });

  test("行内进度：percent 缺省表示没有可量化进度 —— 不画进度条（原型「已完成」「任务出错」即此）", async () => {
    const container = await render(
      <>
        <InlineProgress label="下载中 · 62%" percent={62} />
        <InlineProgress label="已完成 · 可定位文件" />
      </>,
    );
    const bars = container.querySelectorAll('[role="progressbar"]');
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "62");
    expect(container.textContent).toContain("已完成 · 可定位文件");
  });

  test("创作者行的关注按钮是二元态，用 aria-pressed 表达", async () => {
    const onFollow = vi.fn();
    const container = await render(
      <>
        <CreatorRow name="潮汕好男人" followed onFollow={onFollow} />
        <CreatorRow name="琴键上的猫" followed={false} onFollow={onFollow} />
      </>,
    );
    const [followed, notFollowed] = Array.from(container.querySelectorAll("button"));
    expect(followed).toHaveAttribute("aria-pressed", "true");
    expect(followed).toHaveTextContent("已关注");
    expect(notFollowed).toHaveAttribute("aria-pressed", "false");
    expect(notFollowed).toHaveTextContent("关注");
    await act(async () => notFollowed?.click());
    expect(onFollow).toHaveBeenCalledOnce();
  });

  test("弹层是可命名的 dialog，且固定几何来自令牌", async () => {
    const container = await openDialog(
      <Dialog
        isOpen
        onOpenChange={() => undefined}
        title="批量下载音频"
        sub="先选音质与范围"
        lines={["音质：自动 30232"]}
        footer={<DialogAction>加入下载队列</DialogAction>}
      />,
    );
    expect(container).not.toBeNull();
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog).toHaveAttribute("aria-label", "批量下载音频");
    expect(dialog).toHaveTextContent("音质：自动 30232");
  });
});

/* ------------------------------------------------- 顶栏分段组（消费取证） */

describe("顶栏分段组消费的是原型登记的那几个令牌", () => {
  /**
   * 这条测试是防**回退**的：内联版曾把两处白色叠层临时收敛到更接近的
   * `surface-hover`（白 10%），因为 8% / 9% 当时没登记进色板。P2 登记之后
   * 改回了原型值 —— 如果哪天又有人「图省事」换回语义档位，这里会红。
   */
  test("容器底白 9%、悬停底白 8%、未激活文字用顶栏标签色", async () => {
    const container = await render(
      <MemoryRouter initialEntries={["/library"]}>
        <SegmentNav
          segments={[
            { label: "我的音乐库", href: "/library" },
            { label: "发现音乐", href: "/" },
          ]}
        />
      </MemoryRouter>,
    );

    const group = container.querySelector("nav");
    expect(group).not.toBeNull();
    expect(group?.className).toContain("--biu-veil-9");
    // 整条顶栏是可拖动窗口区域，分段组必须自己挡住拖动才点得到。
    expect(group?.className).toContain("window-no-drag");
    // 导航型：激活态走 aria-current，未激活项才是「标签色 + 8% 悬停」。
    expect(container.querySelector('a[aria-current="page"]')).toHaveTextContent("我的音乐库");

    const inactive = Array.from(container.querySelectorAll("a")).find(node => node.textContent === "发现音乐");
    expect(inactive?.className).toContain("--biu-text-chrome-label");
    expect(inactive?.className).toContain("--biu-veil-8");
  });
});

/* ------------------------------------------------------- 壳层与标题（回归） */
describe("design system components", () => {
  test("AppShell exposes stable navigation, main content and player regions", async () => {
    const container = await render(
      <AppShell topbar={<div>顶栏</div>} player={<div>播放控制</div>}>
        <div>页面内容</div>
      </AppShell>,
    );

    expect(container.querySelector('a[href="#main-content"]')).toHaveTextContent("跳转到主要内容");
    expect(container.querySelector("header")).toHaveTextContent("顶栏");
    expect(container.querySelector("main#main-content")).toHaveTextContent("页面内容");
    expect(container.querySelector('section[aria-label="播放器"]')).toHaveTextContent("播放控制");
  });

  test("PageHeader 的迁移别名（description / actions）仍然可用", async () => {
    const container = await render(
      <PageHeader title="音乐库" description="收藏的音乐" actions={<button type="button">播放</button>} />,
    );
    expect(container.querySelector("h1")).toHaveTextContent("音乐库");
    expect(container.querySelector("p")).toHaveTextContent("收藏的音乐");
    expect(container.querySelector("button")).toHaveTextContent("播放");
  });

  test("PageHeader 的新契约：lead / baseline / aside 两列", async () => {
    const container = await render(
      <PageHeader title="发现音乐" lead="按榜单与合集发现内容。" baseline="flat" aside={<aside>右栏</aside>} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.gridTemplateColumns).toContain("minmax(0, 1fr)");
    expect(root.style.gridTemplateColumns).toContain("360px");
    expect(container.querySelector("aside")).toHaveTextContent("右栏");
    expect(container.textContent).toContain("按榜单与合集发现内容。");
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
