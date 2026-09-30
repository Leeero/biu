import { useNavigate } from "react-router";

import { SCREEN_11_SETTINGS_FIXTURE as fixture } from "@/ui/fixtures/screen-11-settings";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { InfoPanel } from "@/ui/patterns/info-panel";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackCell,
  TrackIndex,
  TrackTable,
  TrackTableRow,
  TrackText,
  type TrackTableColumn,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { Icon, type IconName } from "@/ui/primitives/icon";

const columns: TrackTableColumn[] = [];

export const SettingsOverview = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={fixture.title}
        lead={fixture.lead}
        aside={<InfoPanel eyebrow="当前配置" items={[...fixture.panel]} />}
      >
        <FilterBar label="设置快捷操作">
          {fixture.pills.map((label, index) => (
            <Button
              key={label}
              variant={index === 0 ? "primary" : index === fixture.pills.length - 1 ? "accent" : "neutral"}
              onClick={() => navigate(`/settings?tab=${index === 2 ? "about" : index === 3 ? "about" : "general"}`)}
            >
              {label}
            </Button>
          ))}
        </FilterBar>
      </PageHeader>

      <Section title={fixture.sectionTitle}>
        <TrackTable variant="settings" columns={columns} className="mt-[47px]">
          {fixture.rows.map((row, index) => (
            <TrackTableRow key={row.title}>
              <TrackIndex value={index + 1} />
              <span className="relative z-[1] flex size-10 items-center justify-center rounded-[10px] bg-[var(--biu-accent-soft)] text-[rgb(var(--biu-accent))]">
                <Icon name={row.icon as IconName} size={20} />
              </span>
              <button
                type="button"
                className="relative z-[1] min-w-0 text-left"
                onClick={() => navigate(`/settings?tab=${row.tab}`)}
              >
                <TrackText title={row.title} subtitle={row.subtitle} />
              </button>
              <TrackCell tone={"danger" in row && row.danger ? "danger" : "normal"}>{row.value}</TrackCell>
              <TrackCell align="end">{row.count}</TrackCell>
            </TrackTableRow>
          ))}
        </TrackTable>
      </Section>
    </>
  );
};
