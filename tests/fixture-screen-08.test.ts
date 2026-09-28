import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { PLACEHOLDER_RADIALS } from "@/ui/fixtures/placeholder-art";
import { SCREEN_07_DISCOVER_CARD_FIXTURE } from "@/ui/fixtures/screen-07-discover-card";
import { DISCOVER_LIST_FIXTURE_NAME, SCREEN_08_DISCOVER_LIST_FIXTURE } from "@/ui/fixtures/screen-08-discover-list";

/**
 * 屏 08 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与屏 01/02/06/07 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/08-discover-list.json");

describe("屏 08 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_08_DISCOVER_LIST_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 08 屏", () => {
    expect(fixture.no).toBe("08");
    expect(fixture.route).toBe("/");
    expect(fixture.name).toBe("发现音乐 · 列表");
    // 夹具名必须与原型文件名同根 —— `verify.py` 就是用 `screens/08-discover-list.html`
    // 的 stem 拼出 `?fixture=08-discover-list` 的（resolve_target）。
    expect(DISCOVER_LIST_FIXTURE_NAME).toBe("08-discover-list");
  });

  test("整份内容一致", () => {
    expect(SCREEN_08_DISCOVER_LIST_FIXTURE).toEqual({
      head: fixture.head,
      filters: fixture.filters,
      section: fixture.section,
      tracks: fixture.tracks,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("5 行曲目：序号 1–5，缩略图逐行指名 listRow1..5", () => {
    const { tracks } = SCREEN_08_DISCOVER_LIST_FIXTURE;

    expect(tracks).toHaveLength(5);
    expect(tracks.map(track => track.index)).toEqual([1, 2, 3, 4, 5]);
    expect(tracks.map(track => track.artVariant)).toEqual(["listRow1", "listRow2", "listRow3", "listRow4", "listRow5"]);

    for (const track of tracks) {
      expect(Object.keys(PLACEHOLDER_RADIALS)).toContain(track.artVariant);
      // 五条都必须是**等值渐变**（起止同色）——设计稿这五行是纯平色，而等值渐变
      // 同时也是闸门要求：内容带探针阈值为 60，渐变的远端一旦偏离就会把缩略图
      // 顶部整片判成墨迹（屏 07 的占位正是栽在这里，1.3.19 第 ④ 条）。
      const value = PLACEHOLDER_RADIALS[track.artVariant];
      const stops = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")")).split(",");
      expect(stops[stops.length - 2]?.trim()).toBe(stops[stops.length - 1]?.trim());
    }
  });

  test("第 04 行是操作带演示位，**不是**当前播放行", () => {
    const { tracks } = SCREEN_08_DISCOVER_LIST_FIXTURE;
    const demo = tracks.filter(track => track.demoActions);

    expect(demo.map(track => track.index)).toEqual([4]);
    // 「当前行」在本夹具里**没有对应字段**：设计稿第 9 页第 04 行与相邻行在操作带
    // 之外（x850–1300）的列中位差 = 0.0，行 3/4/5 同为 7.00。原型的
    // `.track-row.is-current::before` 是原型发挥。谁把 `current: true` 加回来，
    // 这条会红（spec-lock screens[07].rowStateRule）。
    expect(JSON.stringify(tracks)).not.toContain("current");
  });

  test("表头四列：第二列「标题」、第三列统计、第四列时长", () => {
    expect(SCREEN_08_DISCOVER_LIST_FIXTURE.section.head).toEqual(["#", "标题", "播放 · 点赞 · 弹幕", "时长"]);
    // 段标题里「B 站」之间**有**一个空格 —— 与第 3 枚药丸的「B站音乐分区」不同，
    // 两处是设计稿原文如此，不要顺手统一。
    expect(SCREEN_08_DISCOVER_LIST_FIXTURE.section.title).toBe("B 站音乐分区最新推荐 · 5 条");
  });

  test("筛选条 5 枚药丸，且**不是**屏 07 的那一组文案", () => {
    const { filters } = SCREEN_08_DISCOVER_LIST_FIXTURE;

    expect(filters).toHaveLength(5);
    expect(filters.map(pill => pill.variant)).toEqual(["primary", "secondary", "neutral", "neutral", "accent"]);

    // 第 3 / 4 枚与屏 07（第 8 页）不同 —— 这解释了筛选条容器宽的差（本页 64–771、
    // 第 8 页 65–793）。第 5 枚是本屏的展示模式。
    expect(filters[2]?.label).toBe("B站音乐分区 · 1003");
    expect(filters[3]?.label).toBe("数据源 · 分区推荐 + 新歌");
    expect(filters[4]?.label).toBe("显示模式 · 列表 ▾");

    const other = SCREEN_07_DISCOVER_CARD_FIXTURE.filters.map(pill => pill.label);
    expect(other).not.toContain(filters[2]?.label);
    expect(other).not.toContain(filters[3]?.label);
    expect(filters[4]?.label).toContain("列表");
  });

  test("顶栏 chrome 不进屏级夹具", () => {
    // 「音乐分区 | 单一模块」与「已下线: 流行 / 鬼畜」是**路由级 chrome**
    // （topbarSegments.byRoute["/"] / globalChrome.topbarNote），机制在 route-shell.ts。
    // 本屏的页面文案里本来就含「B 站音乐分区」（药丸与段标题），故不能像屏 07 那样
    // 用字符串出现与否来判 —— 改成判**字段缺席**。
    const keys = Object.keys(SCREEN_08_DISCOVER_LIST_FIXTURE);
    expect(keys).not.toContain("topbarNote");
    expect(keys).not.toContain("segments");
    expect(JSON.stringify(SCREEN_08_DISCOVER_LIST_FIXTURE)).not.toContain("已下线");
  });

  test("文案红线：注解带要点明分区收敛与新列表字段", () => {
    const { note } = SCREEN_08_DISCOVER_LIST_FIXTURE;
    expect(note).toContain("rid=1003");
    expect(note).toContain("rid=1007");
    expect(note).toContain("不与本地库混排");
  });

  test("播放栏与屏 07 不是同一条：22.3% 的进度、队列 12", () => {
    const { nowPlaying } = SCREEN_08_DISCOVER_LIST_FIXTURE;

    expect(nowPlaying.quality).toBe("lossless");
    // 设计稿本页写的是 00:54 / 04:02；填充实测画到 x923（54 / 242 = 22.3%），
    // 与它自己的时间文字自洽（填充宽度本身无闸门，见 JSON 的 nowPlayingRule）。
    expect(nowPlaying.elapsedSeconds / nowPlaying.durationSeconds).toBeCloseTo(0.223, 2);
    expect(nowPlaying.queueCount).toBe(12);
    // 运输键是播放三角，不是暂停。
    expect(nowPlaying.playing).toBe(false);
    // 同页两分支的播放栏内容不同 —— 不要为了「同路由同栏」而复用屏 07 的那一份。
    expect(nowPlaying.title).not.toBe(SCREEN_07_DISCOVER_CARD_FIXTURE.nowPlaying.title);
  });
});
