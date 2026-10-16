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
import { Icon } from "@/ui/primitives/icon";

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
  { key: "file", label: labels[1], inset: "var(--lili-layout-head-title-inset)" },
  { key: "status", label: labels[2] },
  { key: "size", label: labels[3], align: "end" },
];

interface DownloadsViewProps {
  title: ReactNode;
  lead: ReactNode;
  /** 页面内分类 tab（全部 / 音频 / 视频），渲染在页头正下方。 */
  tabs?: ReactNode;
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

const visibleActions = (row: DownloadRowViewModel) => {
  const actions: ContextMenuItem[] = [];
  if (row.status.includes("完成")) actions.push(ROW_ACTIONS[0]!);
  if (row.status.includes("下载中")) actions.push(ROW_ACTIONS[1]!);
  if (row.status.includes("暂停")) actions.push(ROW_ACTIONS[2]!);
  if (row.status.includes("出错")) actions.push(ROW_ACTIONS[3]!);
  actions.push(ROW_ACTIONS[4]!);
  return actions;
};

export const DownloadsView = ({
  title,
  lead,
  tabs,
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
      {!note ? (
        <div className="manage4188-page">
          <header className="manage4188-head">
            <div>
              <span>离线内容</span>
              <h1>{title}</h1>
              <p>{lead}</p>
            </div>
            <div className="manage4188-actions">
              {pills.map(pill => (
                <button
                  key={pill.key}
                  type="button"
                  disabled={pill.disabled}
                  className={
                    pill.variant === "primary" ? "is-primary" : pill.variant === "danger" ? "is-danger" : undefined
                  }
                  onClick={() => onPillPress(pill.key)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </header>
          {tabs}
          <section className="manage4188-downloads">
            <h2>{sectionTitle}</h2>
            <div className="manage4188-task-grid">
              {rows.map(row => (
                <ContextMenu key={row.id} items={visibleActions(row)} onAction={action => onRowAction(row.id, action)}>
                  <article className="manage4188-task">
                    <button type="button" className="manage4188-task-main" onClick={() => onRowPress(row.id)}>
                      {row.art ? <img src={row.art} alt="" /> : <span className="manage4188-task-cover" />}
                      <span>
                        <strong>{row.title}</strong>
                        <small>{row.subtitle}</small>
                      </span>
                    </button>
                    <div className="manage4188-task-status">
                      <span>
                        <b>{row.status}</b>
                        <small>{row.size}</small>
                      </span>
                      {row.progress !== undefined && (
                        <progress max="100" value={row.progress}>
                          {row.progress}%
                        </progress>
                      )}
                    </div>
                    <div className="manage4188-task-actions">
                      {visibleActions(row).map(action => (
                        <button
                          key={action.key}
                          type="button"
                          aria-label={`${action.label} ${row.title}`}
                          onClick={() => onRowAction(row.id, action.key)}
                        >
                          <Icon
                            name={
                              action.key === "delete"
                                ? "trash"
                                : action.key === "open"
                                  ? "folder-open"
                                  : action.key === "retry"
                                    ? "refresh"
                                    : action.key === "pause"
                                      ? "pause"
                                      : "play"
                            }
                          />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                </ContextMenu>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
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
          {tabs}
          <Section title={sectionTitle}>
            <TrackTable variant="download" columns={columns}>
              {rows.map(row => (
                <ContextMenu key={row.id} items={ROW_ACTIONS} onAction={action => onRowAction(row.id, action)}>
                  <TrackTableRow trackId={row.id}>
                    <TrackIndex value={row.index} />
                    <button
                      type="button"
                      className="relative z-[1] flex min-w-0 items-center gap-[var(--lili-layout-track-gap)] text-left"
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
        </>
      )}
    </ScrollContainer>
    {note ? <AnnotationBand>{note}</AnnotationBand> : null}
  </>
);
