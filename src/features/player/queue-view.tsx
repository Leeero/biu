import type { ReactNode } from "react";

import ScrollContainer from "@/components/scroll-container";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
  type TrackActionSpec,
  type TrackTableColumn,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { Pill, type PillVariant } from "@/ui/primitives/pill";

export interface QueueRow {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  status: string;
  duration: string;
  art?: string;
  artKey?: string;
  placeholder?: string;
  current?: boolean;
  demoActions?: boolean;
}
export interface QueuePill {
  key: string;
  label: ReactNode;
  kind: PillVariant;
  action?: boolean;
}
export const queueColumns = (labels: readonly string[]): TrackTableColumn[] => [
  { key: "index", label: labels[0] },
  { key: "title", label: labels[1], inset: "var(--biu-layout-head-title-inset)" },
  { key: "status", label: labels[2] },
  { key: "duration", label: labels[3], align: "end" },
];
const ACTIONS: TrackActionSpec[] = [
  { key: "play", label: "播放", icon: "play" },
  { key: "play-next", label: "下一首播放", icon: "next" },
  { key: "top", label: "置顶", icon: "queue-add" },
  { key: "favorite", label: "收藏", icon: "heart" },
  { key: "remove", label: "移除", icon: "download" },
];

interface Props {
  title: ReactNode;
  lead: ReactNode;
  pills: readonly QueuePill[];
  sectionTitle: ReactNode;
  columns: TrackTableColumn[];
  rows: readonly QueueRow[];
  currentId?: string;
  note?: ReactNode;
  onPillPress: (key: string) => void;
  onRowAction: (row: QueueRow, key: string) => void;
  onReorder: (from: number, to: number) => void;
}

export const QueueView = ({
  title,
  lead,
  pills,
  sectionTitle,
  columns,
  rows,
  currentId,
  note,
  onPillPress,
  onRowAction,
  onReorder,
}: Props) => (
  <>
    <ScrollContainer enableBackToTop className="h-full w-full">
      <PageHeader title={title} lead={lead}>
        <FilterBar label="播放队列操作" gap="base">
          {pills.map(pill =>
            pill.action ? (
              <Button key={pill.key} variant={pill.kind} onClick={() => onPillPress(pill.key)}>
                {pill.label}
              </Button>
            ) : (
              <Pill key={pill.key} variant={pill.kind}>
                {pill.label}
              </Pill>
            ),
          )}
        </FilterBar>
      </PageHeader>
      <Section title={sectionTitle}>
        <TrackTable columns={columns} currentId={currentId} onReorder={onReorder}>
          {rows.map((row, position) => (
            <TrackTableRow key={row.id} trackId={row.id} current={row.current} position={position}>
              <TrackIndex value={row.index} />
              <TrackMain>
                <TrackArt src={row.art} artKey={row.artKey} placeholder={row.placeholder} />
                <TrackText title={row.title} subtitle={row.subtitle} />
              </TrackMain>
              <TrackCell>{row.status}</TrackCell>
              <TrackCell align="end">{row.duration}</TrackCell>
              {row.demoActions && (
                <TrackTableActions
                  actions={ACTIONS.map(action => ({ ...action, onPress: () => onRowAction(row, action.key) }))}
                />
              )}
            </TrackTableRow>
          ))}
        </TrackTable>
      </Section>
    </ScrollContainer>
    {note ? <AnnotationBand>{note}</AnnotationBand> : null}
  </>
);
