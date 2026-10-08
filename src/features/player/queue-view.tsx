import type { ReactNode } from "react";

import { RiCloseLine, RiDragMove2Fill, RiMore2Fill, RiPlayLargeFill } from "@remixicon/react";

import type { TrackTableColumn } from "@/ui/patterns/track-table";
import type { PillVariant } from "@/ui/primitives/pill";

import ScrollContainer from "@/components/scroll-container";
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
export const queueColumns = (labels: readonly string[]): TrackTableColumn[] =>
  labels.map((label, index) => ({ key: ["index", "title", "status", "duration"][index], label })) as TrackTableColumn[];
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
  rows,
  currentId,
  onPillPress,
  onRowAction,
  onReorder,
}: Props) => (
  <ScrollContainer enableBackToTop className="h-full w-full">
    <div className="queue4188-page">
      <header className="queue4188-head">
        <div>
          <span>当前会话</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        <div className="queue4188-actions">
          {pills.map(pill =>
            pill.action ? (
              <button
                key={pill.key}
                type="button"
                onClick={() => onPillPress(pill.key)}
                className={pill.kind === "primary" ? "is-primary" : ""}
              >
                {pill.label}
              </button>
            ) : (
              <span key={pill.key}>{pill.label}</span>
            ),
          )}
        </div>
      </header>
      <section className="queue4188-list" aria-label={String(sectionTitle)}>
        {rows.length ? (
          <>
            {rows.map((row, position) => (
              <article key={row.id} className={row.id === currentId ? "queue4188-row is-current" : "queue4188-row"}>
                <button
                  type="button"
                  className="queue4188-drag"
                  aria-label={`移动 ${row.title}`}
                  onClick={() => onReorder(position, Math.min(position + 1, rows.length - 1))}
                >
                  <RiDragMove2Fill size={17} />
                </button>
                <span className="queue4188-index">
                  {row.id === currentId ? "▶" : String(row.index).padStart(2, "0")}
                </span>
                {row.art ? <img src={row.art} alt="" /> : <span className="queue4188-cover" />}
                <span className="queue4188-copy">
                  <strong>{row.title}</strong>
                  <small>{row.subtitle}</small>
                </span>
                <span className="queue4188-status">{row.status}</span>
                <time>{row.duration}</time>
                <span className="queue4188-row-actions">
                  <button type="button" aria-label={`播放 ${row.title}`} onClick={() => onRowAction(row, "play")}>
                    <RiPlayLargeFill />
                  </button>
                  <button type="button" aria-label={`更多 ${row.title}`} onClick={() => onRowAction(row, "play-next")}>
                    <RiMore2Fill />
                  </button>
                  <button type="button" aria-label={`移除 ${row.title}`} onClick={() => onRowAction(row, "remove")}>
                    <RiCloseLine />
                  </button>
                </span>
              </article>
            ))}
          </>
        ) : (
          <div className="queue4188-empty">
            <strong>队列已清空</strong>
            <span>从音乐内容中添加歌曲</span>
          </div>
        )}
      </section>
    </div>
  </ScrollContainer>
);
