import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { PLACEHOLDER_RADIALS } from "@/ui/fixtures/placeholder-art";
import { DISCOVER_CARD_FIXTURE_NAME, SCREEN_07_DISCOVER_CARD_FIXTURE } from "@/ui/fixtures/screen-07-discover-card";

/**
 * 屏 07 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与屏 01/02/06 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/07-discover-card.json");

describe("屏 07 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_07_DISCOVER_CARD_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 07 屏", () => {
    expect(fixture.no).toBe("07");
    expect(fixture.route).toBe("/");
    expect(fixture.name).toBe("发现音乐 · 卡片");
    expect(DISCOVER_CARD_FIXTURE_NAME).toBe("07-discover-card");
  });

  test("整份内容一致", () => {
    expect(SCREEN_07_DISCOVER_CARD_FIXTURE).toEqual({
      head: fixture.head,
      filters: fixture.filters,
      heroSection: fixture.heroSection,
      hero: fixture.hero,
      albumSection: fixture.albumSection,
      albums: fixture.albums,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("每张专辑卡的封面档都落在占位档清单内，且三张互不相同", () => {
    for (const album of SCREEN_07_DISCOVER_CARD_FIXTURE.albums) {
      expect(Object.keys(PLACEHOLDER_RADIALS)).toContain(album.artVariant);
    }
    // 三张卡的封面逐字对设计稿第 8 页（三条纯平色），不做哈希挑选 —— 故三者不同。
    const variants = SCREEN_07_DISCOVER_CARD_FIXTURE.albums.map(album => album.artVariant);
    expect(variants).toEqual(["albumCard1", "albumCard2", "albumCard3"]);
    expect(new Set(variants).size).toBe(3);
    // 三档的取值必须真的是**等值渐变**（起止同色）——1.3.19 的核心结论：
    // 原型那几条渐变的起点亮度 69.7 高于内容带阈值 60，会把徽标墨迹并进封面带。
    for (const variant of variants) {
      const value = PLACEHOLDER_RADIALS[variant];
      const stops = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")")).split(",");
      expect(stops[stops.length - 2]?.trim()).toBe(stops[stops.length - 1]?.trim());
    }
  });

  test("大卡封面用卡片分支的档（heroCard，不是 heroList），且同样是等值渐变", () => {
    // 设计稿第 8 页大卡封面是纯平色 (27,33,49) = #1b2131；heroList（#2b3550）是
    // 列表分支（屏 08）的固定渐变。
    expect(SCREEN_07_DISCOVER_CARD_FIXTURE.hero.artVariant).toBe("heroCard");
    expect(Object.keys(PLACEHOLDER_RADIALS)).toContain(SCREEN_07_DISCOVER_CARD_FIXTURE.hero.artVariant);
    expect(PLACEHOLDER_RADIALS.heroCard).toBe("linear-gradient(150deg, #1b2131, #1b2131)");
  });

  test("专辑卡首枚标签是「想听」，不是原型的「畅销」", () => {
    // 1.3.19 订正：三张卡此前都照原型写成了「畅销」。设计稿逐张读出
    // 「想听 1.2 万 / 8,640 / 3,120」。
    const labels = SCREEN_07_DISCOVER_CARD_FIXTURE.albums.map(album => album.tags[0]?.label ?? "");
    expect(labels).toEqual(["想听 1.2 万", "想听 8,640", "想听 3,120"]);
    for (const label of labels) expect(label).not.toContain("畅销");
  });

  test("3 张专辑卡：都不带画幅说明", () => {
    expect(SCREEN_07_DISCOVER_CARD_FIXTURE.albums).toHaveLength(3);
    for (const album of SCREEN_07_DISCOVER_CARD_FIXTURE.albums) {
      // 设计稿三张封面左下角逐点为空（1.3.16 第 4 条）。缺字段本身就是真值 ——
      // 谁照原型把「1:1」补回来，这条会拦下。
      expect("ratioNote" in album).toBe(false);
    }
    // 大卡相反：画幅说明存在且非空。
    expect(SCREEN_07_DISCOVER_CARD_FIXTURE.hero.ratioNote).toBe("16:9 原始比例 · 不做方形裁切");
  });

  test("筛选条 5 枚药丸，首枚主操作、末枚展示模式", () => {
    const { filters } = SCREEN_07_DISCOVER_CARD_FIXTURE;
    expect(filters).toHaveLength(5);
    expect(filters.map(pill => pill.variant)).toEqual(["primary", "secondary", "neutral", "neutral", "accent"]);
    // 第 5 枚带当前的展示模式与下拉指示符；「卡片」即本屏（卡片分支）。
    expect(filters[4]?.label).toBe("显示模式 · 卡片 ▾");
    expect(filters[4]?.label).toContain("卡片");
  });

  test("标签变体：大卡首枚是音质档，专辑卡首枚是强调档", () => {
    const { hero, albums } = SCREEN_07_DISCOVER_CARD_FIXTURE;
    expect(hero.tags.map(tag => tag.variant)).toEqual(["quality", "plain", "plain"]);
    for (const album of albums) {
      expect(album.tags.map(tag => tag.variant)).toEqual(["accent", "plain"]);
    }
  });

  test("顶栏 chrome 不进屏级夹具", () => {
    // 「已下线: 流行 / 鬼畜」与「音乐分区 | 单一模块」是**路由级 chrome**
    // （globalChrome.topbarNote / topbarSegments.byRoute["/"]），机制在
    // route-shell.ts。屏级夹具里出现它就是重复声明，两处会各自漂移。
    expect("topbarNote" in SCREEN_07_DISCOVER_CARD_FIXTURE).toBe(false);
    const serialized = JSON.stringify(SCREEN_07_DISCOVER_CARD_FIXTURE);
    expect(serialized).not.toContain("已下线");
    expect(serialized).not.toContain("音乐分区");
  });

  test("文案红线：注解带要点明接口已返回而未兑现的三件事", () => {
    // 与屏 06 的注解带同族 —— 它是设计稿自己的表述，断言它的存在，防止未来被
    // 当成调试说明顺手删掉。
    const note = SCREEN_07_DISCOVER_CARD_FIXTURE.note;
    expect(note).toContain("672w_378h_1c");
    expect(note).toContain("rec_reason");
    expect(note).toContain("displayMode 实为三档（card / list / compact）");
  });

  test("播放栏是无损档，进度 82 / 228 = 36%", () => {
    const { nowPlaying } = SCREEN_07_DISCOVER_CARD_FIXTURE;
    expect(nowPlaying.quality).toBe("lossless");
    // 原型的进度条是 width: 36% —— 夹具里的秒数必须与它同源。
    expect(nowPlaying.elapsedSeconds / nowPlaying.durationSeconds).toBeCloseTo(0.36, 2);
    expect(nowPlaying.queueCount).toBe(12);
    expect(nowPlaying.playing).toBe(false);
  });
});
