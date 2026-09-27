import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { SEARCH_FIXTURE_NAME, SCREEN_06_SEARCH_FIXTURE } from "@/ui/fixtures/screen-06-search";

/**
 * 屏 06 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与屏 01/02 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/06-search.json");

describe("屏 06 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_06_SEARCH_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 06 屏", () => {
    expect(fixture.no).toBe("06");
    expect(fixture.route).toBe("/search");
    expect(SEARCH_FIXTURE_NAME).toBe("06-search");
  });

  test("整份内容一致", () => {
    expect(SCREEN_06_SEARCH_FIXTURE).toEqual({
      query: fixture.query,
      counts: fixture.counts,
      localLink: fixture.localLink,
      lead: fixture.lead,
      videoSection: fixture.videoSection,
      videos: fixture.videos,
      creatorSection: fixture.creatorSection,
      creators: fixture.creators,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("每个视频行的 artIndex 都落在占位渐变清单内", () => {
    const { gradients } = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/placeholder-art.json"), "utf8"),
    ) as { gradients: string[] };

    for (const video of SCREEN_06_SEARCH_FIXTURE.videos) {
      expect(video.artIndex, `视频「${video.title}」的 artIndex 越界`).toBeGreaterThanOrEqual(0);
      expect(video.artIndex).toBeLessThan(gradients.length);
    }
  });

  test("三行视频，仅第 01 行为操作带演示位", () => {
    expect(SCREEN_06_SEARCH_FIXTURE.videos).toHaveLength(3);
    // 设计稿第 7 页没有当前行高亮，第 01 行只是操作带常驻露出的演示行
    // —— 夹具不得把它声明成当前行。
    expect(SCREEN_06_SEARCH_FIXTURE.videos.filter(video => video.demoActions)).toHaveLength(1);
    expect(SCREEN_06_SEARCH_FIXTURE.videos[0]?.demoActions).toBe(true);
    expect("current" in SCREEN_06_SEARCH_FIXTURE.videos[0]!).toBe(false);
  });

  test("两行创作者，第 1 行已关注、第 2 行未关注", () => {
    expect(SCREEN_06_SEARCH_FIXTURE.creators).toHaveLength(2);
    expect(SCREEN_06_SEARCH_FIXTURE.creators.map(creator => creator.followed)).toEqual([true, false]);
  });

  test("文案红线：筛选类目只允许 music 相关的两类结果", () => {
    // copyConstraints：页面文案不得把「歌曲 / 专辑 / 歌手」当筛选类目提供。
    // 注解带正文里的「歌曲 / 歌单 / 本地文件」出现在「不再出现」的引用框架里，
    // 是设计稿自己的表述，不在此限 —— 断言它的存在，防止未来被"顺手清除"。
    const note = SCREEN_06_SEARCH_FIXTURE.note;
    expect(note).toContain("video 与 bili_user 两类");
    expect(note).toContain("不再出现「歌曲 / 歌单 / 本地文件」筛选");
  });

  test("计数与分段/标题同源", () => {
    // 顶栏分段「音乐视频 · 9 / 创作者 · 2」与两个 Section 标题共用同一份计数
    // （spec-lock topbarSegments.labelSources），夹具里不允许两套数字。
    const { counts, videoSection, creatorSection } = SCREEN_06_SEARCH_FIXTURE;
    expect(videoSection.title).toBe(`音乐视频 · ${counts.video} 条`);
    expect(creatorSection.title).toBe(`创作者 · ${counts.creator} 个`);
  });

  test("播放栏徽标是高清档（AUDIO_QUALITY_LABEL.hd）", () => {
    // 设计稿第 7 页的徽标是「高清 30280」，不是第 01/02 屏的无损档。
    expect(SCREEN_06_SEARCH_FIXTURE.nowPlaying.quality).toBe("hd");
  });
});
