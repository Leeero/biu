/**
 * 屏 07「发现音乐 · 卡片」呈现层测试。
 *
 * 钉三件事：
 *   1. 页面里的屏级节奏（`DISCOVER_RHYTHM`）与真值 `screens[06].rhythmImplementation`
 *      逐项一致 —— 那五个值是设计稿第 8 页的实测，第 9 页就不一样，
 *      所以它们既不能进组件档位表，也不能只活在页面里没人管。
 *   2. **H1 的基线是 `aligned`**。真值里写的 `head-main--flat` 是原型类名，
 *      照它用 flat 会让 H1 落到 111（比设计稿的 121 高 10px）—— 这是
 *      `prototypeBaseline` 里「原型整体高 10」的成因，必须拦住。
 *   3. 夹具内容渲染出的**结构**：单列页头、两段、注解带按页流（不是固定底带）、
 *      专辑卡没有画幅说明、大卡的播放键在。
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { DISCOVER_RHYTHM, DiscoverView, type DiscoverViewProps } from "@/features/discover/discover-view";
import { PLACEHOLDER_RADIALS } from "@/ui/fixtures/placeholder-art";
import { SCREEN_07_DISCOVER_CARD_FIXTURE } from "@/ui/fixtures/screen-07-discover-card";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const spec = JSON.parse(readFileSync(path.resolve(process.cwd(), "docs/design/cplus-spec-lock.json"), "utf8")) as {
  screens: { no: string; rhythmImplementation: Record<string, unknown> }[];
};

const screen07 = spec.screens.find(item => item.no === "07");
if (!screen07) throw new Error("真值里找不到屏 07（screens[].no === '07'）");

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

/** 夹具内容 → `DiscoverView` 的 props（与 `features/discover/fixture.ts` 同形状）。 */
const fixtureProps = (): DiscoverViewProps => {
  const fixture = SCREEN_07_DISCOVER_CARD_FIXTURE;

  return {
    title: fixture.head.title,
    lead: fixture.head.lead,
    filters: fixture.filters.map((pill, index) => ({
      key: `fixture-pill-${index + 1}`,
      label: pill.label,
      variant: pill.variant,
    })),
    heroSectionTitle: fixture.heroSection.title,
    hero: {
      badge: fixture.hero.badge,
      ratioNote: fixture.hero.ratioNote,
      tag: fixture.hero.tag,
      title: fixture.hero.title,
      meta: fixture.hero.meta,
      tags: fixture.hero.tags.map((tag, index) => ({
        key: `fixture-hero-tag-${index + 1}`,
        label: tag.label,
        variant: tag.variant,
      })),
      artVariant: fixture.hero.artVariant,
      onPlay: () => {},
    },
    albumSectionTitle: fixture.albumSection.title,
    albums: fixture.albums.map((album, index) => ({
      key: `fixture-album-${index + 1}`,
      badge: album.badge,
      title: album.title,
      meta: album.meta,
      tags: album.tags.map((tag, tagIndex) => ({
        key: `fixture-album-${index + 1}-tag-${tagIndex + 1}`,
        label: tag.label,
        variant: tag.variant,
      })),
      // 封面逐字取设计稿对应的那一档。**不要**按哈希挑（那是真实路径的
      // `pickPlaceholderGradient`）：比对要求逐字一致，而且封面亮度会进闸门
      // —— 原型渐变的起点亮度 69.7 > 内容带阈值 60，会把封面左侧徽标的墨迹
      // 并进同一条带（spec-lock 1.3.19 第 ④ 条）。
      artPlaceholder: PLACEHOLDER_RADIALS[album.artVariant],
    })),
    note: fixture.note,
  };
};

describe("屏 07 的屏级节奏与真值一致", () => {
  const truth = screen07.rhythmImplementation;

  test("四个像素值逐项相等（它们与第 9 页并不相同，不能从别处抄）", () => {
    expect(DISCOVER_RHYTHM.leadMarginTop).toBe(truth.leadMarginTop);
    expect(DISCOVER_RHYTHM.filterMarginTop).toBe(truth.filterMarginTop);
    expect(DISCOVER_RHYTHM.sectionGap).toBe(truth.sectionGap);
    expect(DISCOVER_RHYTHM.sectionHeadMarginBottom).toBe(truth.sectionHeadMarginBottom);
  });

  test("H1 基线是 aligned —— 真值里的 flat 是原型类名，照它用会整体高 10px", () => {
    const baseline = String(truth.h1Baseline);

    expect(baseline.startsWith("aligned")).toBe(true);
    // 「不是 flat」这句要留在真值里，否则下一个人读到 `head-main--flat`
    // 又会去把基线去掉。
    expect(baseline).toContain("flat");
    // 屏级节奏走像素覆写，**不得**回到组件档位表（那里每屏加一档会无限膨胀）。
    expect(Object.keys(truth)).not.toContain("leadOffset");
  });

  test("段间距是同一处的值：筛选条→首段与段→段都是 sectionGap", () => {
    expect(String(truth.closing)).toContain("sectionGap");
    expect(DISCOVER_RHYTHM.sectionGap).toBe(25);
  });
});

describe("屏 07 呈现结构", () => {
  test("单列页头，H1 只有一枚", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);
    const fixture = SCREEN_07_DISCOVER_CARD_FIXTURE;

    const headings = container.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe(fixture.head.title);
    // 设计稿第 8 页的页头**没有右栏**（第 01 屏才有）—— 有 aside 时会写内联
    // grid-template-columns。
    expect(container.querySelector('[style*="grid-template-columns"]')).toBeNull();
  });

  test("导语与筛选条用屏级像素覆写，不走档位", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);
    const fixture = SCREEN_07_DISCOVER_CARD_FIXTURE;

    const lead = Array.from(container.querySelectorAll("p")).find(node => node.textContent === fixture.head.lead);
    expect(lead).toBeDefined();
    expect((lead as HTMLElement).style.marginTop).toBe(`${DISCOVER_RHYTHM.leadMarginTop}px`);

    const bar = container.querySelector('[role="group"]');
    expect(bar).not.toBeNull();
    expect((bar as HTMLElement).style.marginTop).toBe(`${DISCOVER_RHYTHM.filterMarginTop}px`);
  });

  test("两段的段间距同为 25、标题下距同为 3", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);

    const sections = Array.from(container.querySelectorAll("section"));
    expect(sections).toHaveLength(2);

    for (const section of sections) {
      expect((section as HTMLElement).style.marginTop).toBe(`${DISCOVER_RHYTHM.sectionGap}px`);
      const header = section.querySelector("header");
      expect((header as HTMLElement).style.marginBottom).toBe(`${DISCOVER_RHYTHM.sectionHeadMarginBottom}px`);
    }
  });

  test("大卡的三列与播放键都由令牌给出（不是写死的像素）", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);

    const hero = container.querySelector("article");
    expect(hero).not.toBeNull();
    expect(hero?.className).toContain("--biu-layout-hero-art-w");
    expect(hero?.className).toContain("--biu-layout-hero-play-w");
    expect(hero?.className).toContain("--biu-layout-hero-gap");

    // 播放键是设计稿上可见的一枚 56 圆片 —— 夹具模式也必须渲染。
    const play = container.querySelector('button[aria-label="播放"]') as HTMLElement | null;
    expect(play).not.toBeNull();
    expect(play?.style.width).toBe("56px");
    expect(play?.style.height).toBe("56px");
  });

  test("专辑卡是 3 张，封面尺寸走令牌，且**没有画幅说明**", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);
    const fixture = SCREEN_07_DISCOVER_CARD_FIXTURE;

    // article 共 4 个：大卡 1 + 专辑卡 3。
    expect(container.querySelectorAll("article")).toHaveLength(1 + fixture.albums.length);

    const covers = Array.from(container.querySelectorAll('div[class*="--biu-layout-album-art"]'));
    expect(covers).toHaveLength(fixture.albums.length);

    // 设计稿第 8 页三张专辑封面左下角逐点为空 —— 原型的「1:1」是原型发挥。
    // 这里从**渲染结果**上再确认一次：大卡的画幅说明在，专辑卡的不在。
    const ratioNotes = Array.from(container.querySelectorAll("span")).filter(node =>
      node.textContent?.includes("16:9 原始比例"),
    );
    expect(ratioNotes).toHaveLength(1);
    expect(container.textContent).not.toContain("1:1");
  });

  test("注解带按页流排在内容之后，不是贴视口底的固定带", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} />);
    const fixture = SCREEN_07_DISCOVER_CARD_FIXTURE;

    const note = Array.from(container.querySelectorAll("p")).find(node => node.textContent === fixture.note);
    expect(note).toBeDefined();
    // inline 档给的是 `relative`；固定档会带 `absolute` 与内联 top。
    expect(note?.className).not.toContain("absolute");
    expect((note as HTMLElement).style.top).toBe("");
  });

  test("拿不到 banner 时首段整段不渲染（真实路径的缺数据态）", async () => {
    const container = await render(<DiscoverView {...fixtureProps()} hero={null} />);

    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(container.querySelector("article")).not.toBeNull();
  });
});
