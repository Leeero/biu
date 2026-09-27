import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { PLACEHOLDER_GRADIENTS } from "@/ui/fixtures/placeholder-art";
import { SEARCH_FIXTURE_NAME, SCREEN_06_SEARCH_FIXTURE } from "@/ui/fixtures/screen-06-search";

import type { SearchCreatorRow, SearchVideoRow } from "./search-view";

/**
 * 屏 06 夹具的读取与映射。
 *
 * 只有当 URL 携带 `?fixture=06-search` 时才返回数据；真实路径
 * （getWebInterfaceWbiSearchType / getRelationRelations 等 service）完全不经过
 * 本文件。这样保真度比对（verify.py --target app）拿到的是设计稿第 7 页的
 * 逐字内容，而日常使用仍然走真实数据 —— 两条路径共享同一个 SearchView 视图模型。
 */
export const useSearchFixture = (): boolean => {
  const [params] = useSearchParams();
  return params.get("fixture") === SEARCH_FIXTURE_NAME;
};

export interface SearchFixtureData {
  query: string;
  counts: { video: number; creator: number };
  localLink: string;
  lead: string;
  videoSectionTitle: string;
  videos: SearchVideoRow[];
  creatorSectionTitle: string;
  creators: SearchCreatorRow[];
  /** 常驻演示操作带的行 id（设计稿第 01 行）。 */
  demoActionRowIds: string[];
  note: string;
}

export const useSearchFixtureData = (): SearchFixtureData | null => {
  const enabled = useSearchFixture();

  return useMemo(() => {
    if (!enabled) return null;

    const fixture = SCREEN_06_SEARCH_FIXTURE;

    return {
      query: fixture.query,
      counts: fixture.counts,
      localLink: fixture.localLink,
      lead: fixture.lead,
      videoSectionTitle: fixture.videoSection.title,
      videos: fixture.videos.map((video, index) => ({
        id: `fixture-video-${index + 1}`,
        title: video.title,
        subtitle: video.subtitle,
        duration: video.duration,
        // 封面走显式占位渐变（artIndex 指向 placeholder-art 的 gradients），
        // 逐字对应，不做哈希挑选 —— 比对要求逐字一致。
        placeholder: PLACEHOLDER_GRADIENTS[video.artIndex],
      })),
      creatorSectionTitle: fixture.creatorSection.title,
      creators: fixture.creators.map((creator, index) => ({
        id: `fixture-creator-${index + 1}`,
        name: creator.name,
        meta: creator.meta,
        followed: creator.followed,
      })),
      // 设计稿第 7 页**没有**当前行高亮（第 01 行行内背景与行外无差别），
      // 第 01 行只是操作带常驻露出的演示行 —— 故这里不下发 `current`，
      // 只把该行登记成演示位。详见 spec-lock `geometry.list.currentStateNote`。
      // 用原始下标（非 filter 后下标）拼 id，保证与 videos 数组逐位对齐。
      demoActionRowIds: fixture.videos
        .map((video, index) => (video.demoActions ? `fixture-video-${index + 1}` : null))
        .filter((id): id is string => id !== null),
      note: fixture.note,
    };
  }, [enabled]);
};
