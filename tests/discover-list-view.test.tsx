/**
 * 屏 08「发现音乐 · 列表」呈现层测试。
 *
 * 钉四件事：
 *   1. 页面里的屏级节奏（`DISCOVER_LIST_RHYTHM`）与真值 `screens[07].rhythmImplementation`
 *      逐项一致，且**与屏 07 的那一组不同** —— 两屏是同一路由 `/` 的两条分支，
 *      节奏却是逐值不同的（导语 8 对 18、筛选条 20 对 13、段距 20 对 25），
 *      抄错方向就是把导语放到 202 而不是 192。
 *   2. 表头「标题」列的左内缩落到 DOM 上 —— 设计稿把它对齐到**行内文字列**（x241）
 *      而不是列起点（x120）。此前这类横向错位**零覆盖**：`verify.py` 的带判定
 *      只看得见 y（1.3.22 才补了横向探针 `trackHeadLabels`）。
 *   3. 第 04 行**只有**操作带，没有整行高亮（不加 `data-current`）。
 *   4. 注解带**不在**视图里 —— 它必须由页面渲染成 `<ScrollContainer>` 的兄弟，
 *      否则相对滚动容器（`position: relative`、起于 y=104）定位会低 33px。
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
  DISCOVER_LIST_RHYTHM,
  DiscoverListView,
  discoverListColumns,
  type DiscoverListViewProps,
} from "@/features/discover/discover-list-view";
import { DISCOVER_RHYTHM } from "@/features/discover/discover-view";
import { DISCOVER_LIST_TRACK_ACTIONS } from "@/features/discover/track-actions";
import { PLACEHOLDER_RADIALS } from "@/ui/fixtures/placeholder-art";
import { SCREEN_08_DISCOVER_LIST_FIXTURE } from "@/ui/fixtures/screen-08-discover-list";
import { TrackTable } from "@/ui/patterns/track-table";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const spec = JSON.parse(readFileSync(path.resolve(process.cwd(), "docs/design/cplus-spec-lock.json"), "utf8")) as {
  screens: { no: string; rhythmImplementation: Record<string, unknown>; anchors: Record<string, unknown> }[];
};

const screen08 = spec.screens.find(item => item.no === "08");
if (!screen08) throw new Error("真值里找不到屏 08（screens[].no === '08'）");

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLDivElement }> = [];

const render = async (node: React.ReactNode) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  await act(async () => root.render(<MemoryRouter>{node}</MemoryRouter>));
  return container;
};

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
});

/** 夹具内容 → `DiscoverListView` 的 props（与 `features/discover/fixture.ts` 同形状）。 */
const fixtureProps = (): DiscoverListViewProps => {
  const fixture = SCREEN_08_DISCOVER_LIST_FIXTURE;

  return {
    title: fixture.head.title,
    lead: fixture.head.lead,
    filters: fixture.filters.map((pill, index) => ({
      key: `fixture-pill-${index + 1}`,
      label: pill.label,
      variant: pill.variant,
    })),
    sectionTitle: fixture.section.title,
    columns: discoverListColumns(fixture.section.head),
    tracks: fixture.tracks.map(track => ({
      id: `fixture-track-${track.index}`,
      index: track.index,
      title: track.title,
      subtitle: track.subtitle,
      stats: track.stats,
      duration: track.duration,
      placeholder: PLACEHOLDER_RADIALS[track.artVariant],
    })),
    rowActions: DISCOVER_LIST_TRACK_ACTIONS,
    demoActionRowIds: fixture.tracks.filter(track => track.demoActions).map(track => `fixture-track-${track.index}`),
    onPillPress: () => {},
    onRowAction: () => {},
  };
};

const rowNodes = (container: HTMLElement) => Array.from(container.querySelectorAll('div[class*="--biu-layout-row-h"]'));

/**
 * 把渐变里的十六进制色值写成 jsdom 会回读出来的形式。
 *
 * `style.backgroundImage` 是浏览器归一化之后的串：`#252731` 会被改成
 * `rgb(37, 39, 49)`。直接拿夹具里的原始串比对会把「归一化」误报成「实现没接线」，
 * 所以这里只做等价改写，不引入第二份颜色来源。
 */
const normalizeImage = (value: string) =>
  value.replace(
    /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi,
    (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`,
  );

describe("屏 08 的屏级节奏与真值一致", () => {
  const truth = screen08.rhythmImplementation;

  test("三个像素值逐项相等，且与屏 07 的那一组不同", () => {
    expect(DISCOVER_LIST_RHYTHM.leadMarginTop).toBe(truth.leadMarginTop);
    expect(DISCOVER_LIST_RHYTHM.filterMarginTop).toBe(truth.filterMarginTop);
    expect(DISCOVER_LIST_RHYTHM.sectionGap).toBe(truth.sectionGap);

    // 真值里三个值分别是 8 / 20 / 20，屏 07 是 18 / 13 / 25 —— **三处都不同**。
    // 只要有人「顺手对齐两屏」，这条会红。
    expect(DISCOVER_LIST_RHYTHM.leadMarginTop).not.toBe(DISCOVER_RHYTHM.leadMarginTop);
    expect(DISCOVER_LIST_RHYTHM.filterMarginTop).not.toBe(DISCOVER_RHYTHM.filterMarginTop);
    expect(DISCOVER_LIST_RHYTHM.sectionGap).not.toBe(DISCOVER_RHYTHM.sectionGap);
  });

  test("段标题高与下距取缺省档：本屏**不覆写**（屏 07 的 3 / 24 是被折线以下的大卡补偿推出来的）", () => {
    // 真值里这两个字段有值（8 / 24），但它们是**缺省档**，故本屏不传 headMbPx。
    expect(truth.sectionHeadMarginBottom).toBe(8);
    expect(truth.sectionHeadHeight).toBe(24);
    expect(Object.keys(DISCOVER_LIST_RHYTHM)).not.toContain("sectionHeadMarginBottom");
    // 屏 07 那一条则是 3 —— 两屏的差异要留在代码里可读，否则下一个人会以为漏了。
    expect(DISCOVER_RHYTHM.sectionHeadMarginBottom).toBe(3);
  });

  test("导语的方向不能记反：本页 192 比第 8 页 202 更**高**", () => {
    expect(screen08.anchors.leadTop).toBe(192);
    expect(screen08.anchors.filterTop).toBe(236);
    // 8 = 202 − 192 与 20 = 236 − 216 …：真正的判据是「本屏的 leadMarginTop 更小」。
    // 1.3.22 订正过一处方向写反（原写「第 9 页导语低 10px」），所以在这里再锁一层。
    expect(DISCOVER_LIST_RHYTHM.leadMarginTop).toBeLessThan(DISCOVER_RHYTHM.leadMarginTop);
    expect(DISCOVER_LIST_RHYTHM.filterMarginTop).toBeGreaterThan(DISCOVER_RHYTHM.filterMarginTop);
  });
});

describe("表头列位", () => {
  test("第二列带内缩令牌，其余三列不带", () => {
    const columns = discoverListColumns(["#", "标题", "播放 · 点赞 · 弹幕", "时长"]);

    expect(columns.map(column => column.key)).toEqual(["index", "content", "stats", "duration"]);
    expect(columns[1]?.inset).toBe("var(--biu-layout-head-title-inset)");
    expect(columns[0]?.inset).toBeUndefined();
    expect(columns[2]?.inset).toBeUndefined();
    expect(columns[3]?.inset).toBeUndefined();
    // 时长列右对齐，与行内 `.track-cell--end` 一致。
    expect(columns[3]?.align).toBe("end");
  });

  test("列内缩确实落到表头单元格的左内边距上", async () => {
    // 用**字面长度**测接线（而不是 `var(...)`）：jsdom 的 CSSStyleDeclaration
    // 不保证收下 `var()`，拿它当断言对象会把「环境不支持」误报成「实现没接线」。
    // 令牌本身的取值由 `tests/design-tokens.test.ts` 钉住。
    const container = await render(
      <TrackTable
        columns={[
          { key: "index", label: "#" },
          { key: "content", label: "标题", inset: "121px" },
        ]}
      >
        {null}
      </TrackTable>,
    );
    const head = container.querySelector<HTMLElement>('div[class*="--biu-layout-head-h"]');

    expect(head).not.toBeNull();
    const cells = Array.from(head!.children) as HTMLElement[];
    expect(cells.map(cell => cell.textContent)).toEqual(["#", "标题"]);
    expect(cells[0]?.style.paddingLeft).toBe("");
    expect(cells[1]?.style.paddingLeft).toBe("121px");
  });

  test("本屏表头四列的文字与夹具一致", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);
    const head = container.querySelector<HTMLElement>('div[class*="--biu-layout-head-h"]');

    expect(head).not.toBeNull();
    expect(Array.from(head!.children).map(cell => cell.textContent)).toEqual(
      SCREEN_08_DISCOVER_LIST_FIXTURE.section.head,
    );
  });
});

describe("屏 08 呈现结构", () => {
  test("单列页头：一枚 H1，且没有右栏", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);

    const headings = container.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe(SCREEN_08_DISCOVER_LIST_FIXTURE.head.title);

    // 设计稿第 9 页的页头**没有右栏**（第 01 屏才有）—— 有 `aside` 时 `PageHeader`
    // 会在两列网格容器上写内联 `grid-template-columns`。
    const grid = headings[0]?.parentElement?.parentElement as HTMLElement | undefined;
    expect(grid?.className).toContain("grid");
    expect(grid?.style.gridTemplateColumns).toBe("");
  });

  test("导语与筛选条走屏级像素覆写（8 / 20），不走档位", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);
    const fixture = SCREEN_08_DISCOVER_LIST_FIXTURE;

    const lead = Array.from(container.querySelectorAll("p")).find(node => node.textContent === fixture.head.lead);
    expect(lead).toBeDefined();
    expect((lead as HTMLElement).style.marginTop).toBe(`${DISCOVER_LIST_RHYTHM.leadMarginTop}px`);

    const bar = container.querySelector('[role="group"]');
    expect(bar).not.toBeNull();
    expect((bar as HTMLElement).style.marginTop).toBe(`${DISCOVER_LIST_RHYTHM.filterMarginTop}px`);
  });

  test("只有一段，段间距 20，段标题下距**没有**内联覆写", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);

    const sections = Array.from(container.querySelectorAll("section"));
    expect(sections).toHaveLength(1);

    const section = sections[0] as HTMLElement;
    expect(section.style.marginTop).toBe(`${DISCOVER_LIST_RHYTHM.sectionGap}px`);

    const header = section.querySelector("header") as HTMLElement | null;
    expect(header).not.toBeNull();
    expect(header?.style.marginBottom).toBe("");
    expect(section.querySelector("h2")?.textContent).toBe(SCREEN_08_DISCOVER_LIST_FIXTURE.section.title);
  });

  test("5 行曲目：序号、缩略图、标题/副标题、统计列、时长列", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);
    const fixture = SCREEN_08_DISCOVER_LIST_FIXTURE;

    const rows = rowNodes(container);
    expect(rows).toHaveLength(5);

    // 缩略图是 `Artwork`（根元素是 `span`，不是 `div`），尺寸走 `--biu-layout-art-*`。
    const arts = Array.from(container.querySelectorAll<HTMLElement>('span[class*="--biu-layout-art-w"]'));
    expect(arts).toHaveLength(5);
    // 占位底图**逐行**取夹具指名的档位，且是**等值渐变**（起止同色）——
    // 渐变的远端一旦偏离，缩略图顶部会被内容带探针判成墨迹（屏 07 的教训）。
    const backgrounds = arts.map(art => art.style.backgroundImage);
    expect(backgrounds).toEqual(fixture.tracks.map(track => normalizeImage(PLACEHOLDER_RADIALS[track.artVariant])));
    // 五行各一条纯平色，互不相同 —— 谁改成哈希挑选（真实路径的
    // `pickPlaceholderGradient`），这条会红。
    expect(new Set(backgrounds).size).toBe(5);

    for (const [index, track] of fixture.tracks.entries()) {
      const row = rows[index] as HTMLElement;
      expect(row.textContent).toContain(String(track.index).padStart(2, "0"));
      expect(row.textContent).toContain(track.title);
      expect(row.textContent).toContain(track.subtitle);
      expect(row.textContent).toContain(track.stats);
      expect(row.textContent).toContain(track.duration);
    }
  });

  test("第 04 行只渲染操作带：五枚圆片、无整行高亮", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);

    // 全表**没有**任何一行是当前行 —— 设计稿第 9 页第 04 行与相邻行在操作带之外的
    // 列中位差 = 0.0（原型的 is-current 是原型发挥）。
    expect(container.querySelectorAll("[data-current]")).toHaveLength(0);
    expect(container.innerHTML).not.toContain("data-current");

    // 操作带只出现一次（第 04 行），五枚等大圆片，顺序与设计稿一致。
    const buttons = Array.from(container.querySelectorAll("button[aria-label]"));
    expect(buttons).toHaveLength(5);
    expect(buttons.map(button => button.getAttribute("aria-label"))).toEqual(
      DISCOVER_LIST_TRACK_ACTIONS.map(action => action.label),
    );

    const band = buttons[0]?.parentElement as HTMLElement;
    // 走**缺省**右偏移公式（屏 02 同款）：屏 06 才需要 `right-[224px]` 覆写。
    expect(band.className).toContain("--biu-layout-col-4");
    expect(band.className).not.toContain("224px");

    const row4 = rowNodes(container)[3] as HTMLElement;
    expect(row4.contains(band)).toBe(true);
  });

  test("注解带**不在**视图里（必须由页面渲染成滚动容器的兄弟）", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);

    // 视图里出现注解带就会相对滚动容器（`position: relative`、起于 y=104）定位，
    // 落到 757 —— 比设计稿的 724 低 33px。
    expect(container.textContent).not.toContain("分区收敛");
    // 视图的 props 里也**没有** `note` 这个入口：注解带不是本组件的职责
    // （屏 07 的 `DiscoverView` 有，因为那一屏的注解带按页流排在内容之后）。
    expect(Object.keys(fixtureProps())).not.toContain("note");
  });

  test("筛选条 5 枚药丸都是静态标记（夹具模式不切换展示模式）", async () => {
    const container = await render(<DiscoverListView {...fixtureProps()} />);
    const fixture = SCREEN_08_DISCOVER_LIST_FIXTURE;

    const bar = container.querySelector('[role="group"]') as HTMLElement;
    expect(bar.children).toHaveLength(5);
    expect(Array.from(bar.children).map(child => child.textContent)).toEqual(fixture.filters.map(pill => pill.label));
    // 一枚按钮都没有：夹具模式不触网、不切换模式，所以全走 `Pill`。
    expect(bar.querySelectorAll("button")).toHaveLength(0);
  });
});
