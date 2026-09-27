import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { PLACEHOLDER_GRADIENTS } from "@/ui/fixtures/placeholder-art";
import {
  PLAYLIST_DETAIL_FIXTURE_NAME,
  SCREEN_02_PLAYLIST_DETAIL_FIXTURE,
} from "@/ui/fixtures/screen-02-playlist-detail";

import type { DetailPill, DetailTrackRow } from "./playlist-detail-view";

/**
 * 屏 02 夹具的读取与映射。
 *
 * 只有当 URL 携带 `?fixture=02-playlist-detail` 时才返回数据；真实路径
 * （getFavFolderInfo / getFavResourceList 三条数据通路）完全不经过本文件。
 * 这样保真度比对（verify.py --target app）拿到的是设计稿第 3 页的逐字内容，
 * 而日常使用仍然走真实数据 —— 两条路径共享同一个 PlaylistDetailView 视图模型。
 */
export const usePlaylistDetailFixture = (): boolean => {
  const [params] = useSearchParams();
  return params.get("fixture") === PLAYLIST_DETAIL_FIXTURE_NAME;
};

export interface PlaylistDetailFixtureData {
  title: string;
  lead: string;
  pills: DetailPill[];
  sectionTitle: string;
  head: string[];
  tracks: DetailTrackRow[];
  /** 常驻演示操作带的行 id（设计稿第 04 行）。 */
  demoActionRowIds: string[];
  note: string;
  /** 下载弹层文案（夹具模式恒不弹出，仅承载逐字内容）。 */
  modal: { title: string; sub: string; lines: string[]; action: string };
}

export const usePlaylistDetailFixtureData = (): PlaylistDetailFixtureData | null => {
  const enabled = usePlaylistDetailFixture();

  return useMemo(() => {
    if (!enabled) return null;

    const fixture = SCREEN_02_PLAYLIST_DETAIL_FIXTURE;

    return {
      title: fixture.header.title,
      lead: fixture.header.lead,
      pills: fixture.filterPills.map(pill => ({ kind: pill.kind, label: pill.label })),
      sectionTitle: fixture.section.title,
      head: fixture.section.head,
      tracks: fixture.tracks.map(track => ({
        id: `fixture-track-${track.index}`,
        index: track.index,
        title: track.title,
        subtitle: track.subtitle,
        cell: track.cell,
        duration: track.duration,
        // 封面走显式占位渐变（artIndex 指向 placeholder-art 的 gradients），
        // 逐字对应，不做哈希挑选 —— 比对要求逐字一致。
        placeholder: PLACEHOLDER_GRADIENTS[track.artIndex],
      })),
      // 设计稿第 3 页**没有**当前行高亮（实测第 04 行行内背景 8.23 vs 行外 8.00），
      // 第 04 行只是操作带常驻露出的演示行 —— 故这里不下发 `current`，
      // 只把该行登记成演示位。详见 spec-lock `geometry.list.currentStateNote`。
      demoActionRowIds: fixture.tracks.filter(track => track.demoActions).map(track => `fixture-track-${track.index}`),
      note: fixture.note,
      modal: {
        title: fixture.modal.title,
        sub: fixture.modal.sub,
        lines: [fixture.modal.quality, fixture.modal.range],
        action: fixture.modal.action,
      },
    };
  }, [enabled]);
};
