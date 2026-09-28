import { useMemo } from "react";
import { useSearchParams } from "react-router";

import type { LaterPillKind } from "@/ui/fixtures/screen-03-watch-later";

import { PLACEHOLDER_GRADIENTS } from "@/ui/fixtures/placeholder-art";
import { SCREEN_03_WATCH_LATER_FIXTURE, WATCH_LATER_FIXTURE_NAME } from "@/ui/fixtures/screen-03-watch-later";

import type { LaterTrackRow } from "./later-view";

/**
 * 屏 03 夹具的读取与映射。
 *
 * 只有当 URL 携带 `?fixture=03-watch-later` 时才返回数据；真实路径
 * （getHistoryToViewList / postHistoryToViewDel）完全不经过本文件。
 * 与屏 02 的 `features/playlist/fixture.ts` 同一结构：两条路径在
 * `LaterView` 的 props 上汇合，渲染代码只有一份。
 */
export const useLaterFixture = (): boolean => {
  const [params] = useSearchParams();
  return params.get("fixture") === WATCH_LATER_FIXTURE_NAME;
};

export interface LaterFixtureData {
  title: string;
  lead: string;
  panelEyebrow: string;
  panelItems: string[];
  pills: { kind: LaterPillKind; label: string }[];
  sectionTitle: string;
  head: string[];
  tracks: LaterTrackRow[];
  /** 常驻演示操作带的行 id（设计稿第 04 行）。 */
  demoActionRowIds: string[];
  note: string;
}

export const useLaterFixtureData = (): LaterFixtureData | null => {
  const enabled = useLaterFixture();

  return useMemo(() => {
    if (!enabled) return null;

    const fixture = SCREEN_03_WATCH_LATER_FIXTURE;

    return {
      title: fixture.header.title,
      lead: fixture.header.lead,
      panelEyebrow: fixture.panel.eyebrow,
      panelItems: fixture.panel.items,
      pills: fixture.filterPills.map(pill => ({ kind: pill.kind, label: pill.label })),
      sectionTitle: fixture.section.title,
      head: fixture.section.head,
      tracks: fixture.tracks.map(track => ({
        id: `fixture-later-${track.index}`,
        index: track.index,
        title: track.title,
        subtitle: track.subtitle,
        cell: track.cell,
        progress: track.progress,
        placeholder: PLACEHOLDER_GRADIENTS[track.artIndex],
      })),
      demoActionRowIds: fixture.tracks.filter(track => track.demoActions).map(track => `fixture-later-${track.index}`),
      note: fixture.note,
    };
  }, [enabled]);
};
