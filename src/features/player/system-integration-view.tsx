import { useMemo } from "react";
import { useNavigate } from "react-router";

import { toggleMiniMode } from "@/common/utils/mini-player";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { useShortcutSettings } from "@/store/shortcuts";
import { SCREEN_12_MINI_PLAYER_FIXTURE as fixture } from "@/ui/fixtures/screen-12-mini-player";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableRow,
  TrackText,
  type TrackTableColumn,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/icon";

const columns: TrackTableColumn[] = [
  { key: "index", label: fixture.columns[0] },
  { key: "ability", label: fixture.columns[1], inset: "var(--biu-layout-head-title-inset)" },
  { key: "status", label: fixture.columns[2] },
  { key: "source", label: fixture.columns[3], align: "end" },
];

export const SystemIntegrationView = () => {
  const navigate = useNavigate();
  const { previous, next, togglePlay } = usePlayerActions();
  const globalShortcuts = useShortcutSettings(state => state.globalShortcuts);
  const conflicts = useMemo(() => globalShortcuts.filter(item => item.isConflict), [globalShortcuts]);

  const handlePill = (index: number) => {
    if (index === 0) void toggleMiniMode();
    if (index === 1) void previous();
    if (index === 2) togglePlay();
    if (index === 3) window.electron.closeWindow();
    if (index === 4) navigate("/settings?tab=shortcut");
  };

  return (
    <>
      <PageHeader title={fixture.title} lead={fixture.lead}>
        <FilterBar label="迷你播放器操作">
          {fixture.pills.map((label, index) => (
            <Button
              key={label}
              variant={index === 0 ? "primary" : index === 4 ? "accent" : index === 3 ? "neutral" : "secondary"}
              onClick={() => handlePill(index)}
            >
              {label}
            </Button>
          ))}
        </FilterBar>
      </PageHeader>

      <Section title={fixture.sectionTitle} className="mt-5">
        <TrackTable variant="mini" columns={columns}>
          {fixture.rows.map((row, index) => (
            <TrackTableRow key={row.title}>
              <TrackIndex value={index + 1} />
              <TrackMain>
                <TrackArt placeholder={row.placeholder} />
                <TrackText title={row.title} subtitle={row.subtitle} />
              </TrackMain>
              <TrackCell tone={index === 2 && conflicts.length > 0 ? "danger" : "normal"}>{row.status}</TrackCell>
              <TrackCell align="end">{row.source}</TrackCell>
            </TrackTableRow>
          ))}
        </TrackTable>

        <div className="mt-[7px] flex gap-[31px]">
          <article className="h-[164px] w-[380px] rounded-[var(--biu-radius-tile)] border border-[var(--biu-border-weak)] bg-[var(--biu-veil-5-5)] px-[22px] py-[19px]">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-11 flex-none rounded-lg"
                style={{ backgroundImage: fixture.track.artPlaceholder }}
              />
              <div className="min-w-0">
                <div className="truncate text-[15px] leading-[22px] font-semibold">{fixture.track.title}</div>
                <div className="mt-0.5 text-[13px] leading-5 text-[rgb(var(--biu-text-quaternary))]">
                  {fixture.track.subtitle}
                </div>
              </div>
            </div>
            <div className="mt-[3px] h-[3px] overflow-hidden rounded-sm bg-white/18">
              <span className="block h-full w-[44%] bg-[rgb(var(--biu-accent))]" />
            </div>
            <div className="mt-[17px] flex items-center gap-3">
              <button
                type="button"
                aria-label="上一首"
                onClick={() => void previous()}
                className="flex size-[26px] items-center justify-center rounded-full bg-[var(--biu-veil-14)]"
              >
                <Icon name="prev" size={14} />
              </button>
              <button
                type="button"
                aria-label="播放或暂停"
                onClick={togglePlay}
                className="flex size-[26px] items-center justify-center rounded-full bg-[var(--biu-veil-14)]"
              >
                <Icon name="play" size={14} />
              </button>
              <button
                type="button"
                aria-label="下一首"
                onClick={() => void next()}
                className="flex size-[26px] items-center justify-center rounded-full bg-[var(--biu-veil-14)]"
              >
                <Icon name="next" size={14} />
              </button>
              <button
                type="button"
                className="ml-auto h-[26px] rounded-full bg-[var(--biu-veil-20)] px-4 text-[12px] text-[rgb(var(--biu-text-primary))]"
                onClick={() => void toggleMiniMode()}
              >
                展开
              </button>
            </div>
            <div className="mt-2.5 text-[12px] text-[rgb(var(--biu-text-quaternary))]">{fixture.track.caption}</div>
          </article>

          <article className="h-[164px] w-[257px] rounded-[var(--biu-radius-tile)] border border-[var(--biu-border-weak)] bg-[var(--biu-veil-5-5)] px-[22px] py-[19px]">
            <h3 className="m-0 text-[13px] font-semibold">托盘菜单 · 5 项</h3>
            <div className="mt-[15px] text-[12px] leading-[22px] text-[rgb(var(--biu-text-secondary))]">
              {fixture.trayItems.map(item => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </article>

          <article className="h-[164px] min-w-0 flex-1 rounded-[var(--biu-radius-tile)] border border-[var(--biu-border-weak)] bg-[var(--biu-veil-5-5)] px-[22px] py-[19px]">
            <h3 className="m-0 text-[13px] font-semibold">全局快捷键 · 可在设置中整体禁用</h3>
            <div className="mt-2 text-[12px] leading-[24px] text-[rgb(var(--biu-text-secondary))]">
              {fixture.shortcutRows.map(([label, keys]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span>{label}</span>
                  <span className="font-mono text-[rgb(var(--biu-text-quaternary))]">{keys}</span>
                </div>
              ))}
              <div className="mt-1 rounded-md bg-[rgb(var(--biu-danger)/0.12)] px-2 text-[rgb(var(--biu-danger))]">
                {fixture.conflict}
              </div>
            </div>
          </article>
        </div>
      </Section>
    </>
  );
};
