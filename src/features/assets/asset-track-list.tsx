import type { ReactNode } from "react";

import { RiPlayLargeFill } from "@remixicon/react";

import type { TrackActionSpec } from "@/ui/patterns/track-table";

import { Icon } from "@/ui/primitives/icon";

export interface AssetTrackRow {
  id: string;
  index: number;
  title: string;
  subtitle: ReactNode;
  art?: string;
  middle: ReactNode;
  end: ReactNode;
  current?: boolean;
}

interface Props<T extends AssetTrackRow> {
  label: string;
  rows: readonly T[];
  actions: readonly TrackActionSpec[];
  onAction: (row: T, key: string) => void;
}

export const AssetTrackList = <T extends AssetTrackRow>({ label, rows, actions, onAction }: Props<T>) => (
  <section className="asset4188-list" aria-label={label}>
    {rows.map(row => (
      <article key={row.id} className={row.current ? "asset4188-row is-current" : "asset4188-row"}>
        <span className="asset4188-index">{row.current ? "▶" : String(row.index).padStart(2, "0")}</span>
        {row.art ? <img src={row.art} alt="" /> : <span className="asset4188-cover" />}
        <span className="asset4188-copy">
          <strong>{row.title}</strong>
          <small>{row.subtitle}</small>
        </span>
        <span className="asset4188-middle">{row.middle}</span>
        <span className="asset4188-end">{row.end}</span>
        <span className="asset4188-row-actions">
          <button type="button" aria-label={`播放 ${row.title}`} onClick={() => onAction(row, "play")}>
            <RiPlayLargeFill />
          </button>
          {actions
            .filter(action => action.key !== "play")
            .map(action => (
              <button
                key={action.key}
                type="button"
                aria-label={`${action.label} ${row.title}`}
                onClick={() => onAction(row, action.key)}
              >
                <Icon name={action.icon} />
              </button>
            ))}
        </span>
      </article>
    ))}
  </section>
);
