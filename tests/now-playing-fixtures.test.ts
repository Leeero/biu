import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import type { FixtureNowPlaying } from "@/ui/fixtures/now-playing";

import { NOW_PLAYING_FIXTURES } from "@/features/player/now-playing";

/**
 * 两条**跨屏**不变式 —— 它们守的不是某一份夹具的内容，而是「夹具」与「闸门」之间
 * 那两根接线。1.3.20 就是在这两根接线上同时断了，才让屏 07 的播放栏差异活过验收：
 *
 *   ① 夹具写了 `nowPlaying`，却忘了登记进 `NOW_PLAYING_FIXTURES`
 *      ⇒ 页面夹具照常带出列表，播放栏却仍是空态（设计稿是满态），**看得见但没人判**；
 *   ② 该屏真值里没有 `playbarDetail`
 *      ⇒ 栏内构成完全没闸门，`playbar` 结构带只判「栏高 88」，**看不见也没人判**。
 *
 * 所以这里遍历 `tools/design-fidelity/fixtures/*.json`（verify.py 的同一批取数源），
 * **将来的新屏夹具会自动被扫到**，不需要谁记得往本文件里加一行 —— 这正是 1.3.20
 * 的教训：靠人记得的接线，迟早会忘。
 *
 * 与 P0 的「登记即断言」、P1 的 `ROUTE_SEGMENTS + DEFERRED_SEGMENTS` 恰好覆盖同族。
 */
const FIXTURES_DIR = path.resolve(process.cwd(), "tools/design-fidelity/fixtures");
const SPEC_LOCK = path.resolve(process.cwd(), "docs/design/cplus-spec-lock.json");

interface ScreenFixture {
  no?: string;
  name?: string;
  nowPlaying?: FixtureNowPlaying;
}

interface ScreenTruth {
  no: string;
  name: string;
  playbarDetail?: { probes?: string[]; measured?: Record<string, string> };
}

const screenFixtures = readdirSync(FIXTURES_DIR)
  .filter(file => file.endsWith(".json"))
  .map(file => ({
    stem: file.slice(0, -".json".length),
    fixture: JSON.parse(readFileSync(path.join(FIXTURES_DIR, file), "utf8")) as ScreenFixture,
  }))
  // 屏级夹具必有 `no`；`placeholder-art.json` 是**数据性色值**夹具（封面占位渐变），
  // 不是某一屏，故不在扫掠范围内。
  .filter(entry => typeof entry.fixture.no === "string");

const screens = (JSON.parse(readFileSync(SPEC_LOCK, "utf8")) as { screens: ScreenTruth[] }).screens;
const truthByNo = new Map(screens.map(screen => [screen.no, screen]));

/** 播放栏探针的**全集** —— 真值声明了哪几枚，就必须有哪几枚的实测值。 */
const PLAYBAR_DETAIL_PROBES = ["playbarCover", "playbarPlay", "playbarPill", "playbarGap"];

describe("播放栏夹具接线：跨屏不变式", () => {
  test("夹具目录里确实有屏级夹具（扫掠没有静默空转）", () => {
    // 若某天夹具目录改了名或清了空，上面那些 filter 会让整个文件「零断言通过」——
    // 那是最坏的一种绿。这条把它们钉住。
    expect(screenFixtures.length).toBeGreaterThanOrEqual(4);
    expect(screenFixtures.map(entry => entry.fixture.no)).toEqual(expect.arrayContaining(["01", "02", "06", "07"]));
  });

  test("① 凡夹具声明 nowPlaying 的屏，都必须登记进 NOW_PLAYING_FIXTURES", () => {
    const withNowPlaying = screenFixtures.filter(entry => entry.fixture.nowPlaying);
    expect(withNowPlaying.length).toBeGreaterThanOrEqual(4);

    const missing = withNowPlaying
      .filter(entry => !(entry.stem in NOW_PLAYING_FIXTURES))
      .map(entry => `${entry.fixture.no} ${entry.fixture.name}（夹具 ${entry.stem}.json）`);
    // 屏 07 就是这样漏掉的：夹具写了、表里没有 ⇒ 设计稿满态而渲染空态。
    expect(missing).toEqual([]);
  });

  test("①' 登记的内容与 JSON 逐字一致（TS 模块不该是第二份真相）", () => {
    for (const { stem, fixture } of screenFixtures) {
      const registered = NOW_PLAYING_FIXTURES[stem];
      if (!fixture.nowPlaying || !registered) continue;
      expect(registered).toEqual(fixture.nowPlaying);
    }
  });

  test("①'' 登记表里没有孤儿（有登记却没有对应夹具）", () => {
    const stems = new Set(screenFixtures.map(entry => entry.stem));
    const orphans = Object.keys(NOW_PLAYING_FIXTURES).filter(stem => !stems.has(stem));
    expect(orphans).toEqual([]);
  });

  test("② 凡夹具给了 nowPlaying 的屏，真值里必须有 playbarDetail", () => {
    const ungated: string[] = [];
    for (const { fixture } of screenFixtures) {
      if (!fixture.nowPlaying) continue;
      const truth = truthByNo.get(fixture.no ?? "");
      expect(truth, `屏 ${fixture.no} 不在 spec-lock 的 screens 里`).toBeDefined();
      if (!truth?.playbarDetail) ungated.push(`${fixture.no} ${truth?.name ?? ""}`);
    }
    // 夹具把播放栏驱动成满态、却不为栏内设探针 —— 屏 06 与屏 07 都曾如此（1.3.21 补齐）。
    expect(ungated).toEqual([]);
  });

  test("②' playbarDetail 的探针与实测值成对且完整", () => {
    for (const { fixture } of screenFixtures) {
      if (!fixture.nowPlaying) continue;
      const detail = truthByNo.get(fixture.no ?? "")?.playbarDetail;
      expect(detail?.probes ?? []).toEqual(PLAYBAR_DETAIL_PROBES);
      // 「登记即实测」：声明启用的每一枚，都必须有该页自己量出来的带。
      expect(Object.keys(detail?.measured ?? {}).sort()).toEqual([...PLAYBAR_DETAIL_PROBES].sort());
      for (const probe of PLAYBAR_DETAIL_PROBES) {
        expect(detail?.measured?.[probe], `${fixture.no} 缺 ${probe} 的实测值`).toBeTruthy();
      }
    }
  });
});
