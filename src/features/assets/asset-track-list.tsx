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
      // 整行点击 = 播放（鼠标便捷）；键盘操作由行内操作带的「播放」按钮提供，
      // 故不额外加 tabIndex，避免长列表产生大量 Tab 停留点。
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <article
        key={row.id}
        className={row.current ? "asset4188-row is-current" : "asset4188-row"}
        onClick={() => onAction(row, "play")}
      >
        <span className="asset4188-index">{row.current ? "▶" : String(row.index).padStart(2, "0")}</span>
        {row.art ? <img src={row.art} alt="" /> : <span className="asset4188-cover" />}
        <span className="asset4188-copy">
          <strong>{row.title}</strong>
          <small>{row.subtitle}</small>
        </span>
        <span className="asset4188-middle">{row.middle}</span>
        <span className="asset4188-end">{row.end}</span>
        <span className="asset4188-row-actions" onClick={event => event.stopPropagation()}>
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
