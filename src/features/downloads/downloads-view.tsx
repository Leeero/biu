import type { ReactNode } from "react";

import type { PillVariant } from "@/ui/primitives/pill";

import ContextMenu, { type ContextMenuItem } from "@/components/context-menu";
import ScrollContainer from "@/components/scroll-container";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { InlineProgress } from "@/ui/patterns/inline-progress";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackTable,
  TrackTableRow,
  TrackText,
  type TrackTableColumn,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";

export interface DownloadRowViewModel {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  status: string;
  progress?: number;
  size: string;
  art?: string;
  artKey?: string;
  placeholder?: string;
}

export interface DownloadPillViewModel {
  key: string;
  label: ReactNode;
  variant: PillVariant;
  disabled?: boolean;
}

export const downloadColumns = (labels: readonly string[]): TrackTableColumn[] => [
  { key: "index", label: labels[0] },
  { key: "file", label: labels[1], inset: "var(--biu-layout-head-title-inset)" },
  { key: "status", label: labels[2] },
  { key: "size", label: labels[3], align: "end" },
];

interface DownloadsViewProps {
  title: ReactNode;
  lead: ReactNode;
  pills: readonly DownloadPillViewModel[];
  sectionTitle: ReactNode;
  columns: TrackTableColumn[];
  rows: readonly DownloadRowViewModel[];
  note?: ReactNode;
  onPillPress: (key: string) => void;
  onRowPress: (id: string) => void;
  onRowAction: (id: string, action: string) => void;
}

const ROW_ACTIONS: ContextMenuItem[] = [
  { key: "open", label: "定位文件" },
  { key: "pause", label: "暂停" },
  { key: "resume", label: "继续" },
  { key: "retry", label: "重试" },
  { key: "delete", label: "删除任务", color: "danger" },
];

export const DownloadsView = ({
  title,
  lead,
  pills,
  sectionTitle,
  columns,
  rows,
  note,
  onPillPress,
  onRowPress,
  onRowAction,
}: DownloadsViewProps) => (
  <>
    <ScrollContainer enableBackToTop className="h-full w-full">
      <PageHeader title={title} lead={lead}>
        <FilterBar label="下载管理操作" gap="base">
          {pills.map(pill => (
            <Button
              key={pill.key}
              variant={pill.variant}
              disabled={pill.disabled}
              onClick={() => onPillPress(pill.key)}
            >
              {pill.label}
            </Button>
          ))}
        </FilterBar>
      </PageHeader>
      <Section title={sectionTitle}>
        <TrackTable variant="download" columns={columns}>
          {rows.map(row => (
            <ContextMenu key={row.id} items={ROW_ACTIONS} onAction={action => onRowAction(row.id, action)}>
              <TrackTableRow trackId={row.id}>
                <TrackIndex value={row.index} />
                <button
                  type="button"
                  className="relative z-[1] flex min-w-0 items-center gap-[var(--biu-layout-track-gap)] text-left"
                  onClick={() => onRowPress(row.id)}
                >
                  <TrackArt src={row.art} artKey={row.artKey} placeholder={row.placeholder} />
                  <TrackText title={row.title} subtitle={row.subtitle} />
                </button>
                <TrackCell>
                  <InlineProgress
                    label={row.status}
                    percent={row.progress}
                    className={row.progress === undefined ? undefined : "translate-y-1"}
                  />
                </TrackCell>
                <TrackCell align="end">{row.size}</TrackCell>
              </TrackTableRow>
            </ContextMenu>
          ))}
        </TrackTable>
      </Section>
    </ScrollContainer>
    {note ? <AnnotationBand>{note}</AnnotationBand> : null}
  </>
);
