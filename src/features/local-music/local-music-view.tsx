import type { ReactNode } from "react";

import ContextMenu, { type ContextMenuItem } from "@/components/context-menu";
import ScrollContainer from "@/components/scroll-container";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { FormatCard, FormatGrid, type AudioFormat } from "@/ui/patterns/format-card";
import { PageHeader } from "@/ui/patterns/page-header";
import { Button } from "@/ui/primitives/button";

export interface LocalMusicCardViewModel {
  id: string;
  format: AudioFormat;
  title: string;
  meta: ReactNode;
  badge: ReactNode;
}

interface LocalMusicViewProps {
  title: ReactNode;
  lead: ReactNode;
  cards: readonly LocalMusicCardViewModel[];
  note?: ReactNode;
  busy?: boolean;
  selectedId?: string;
  onPlayAll: () => void;
  onShuffle: () => void;
  onRescan: () => void;
  onDelete: () => void;
  onCardPress: (id: string) => void;
  onCardAction: (id: string, action: string) => void;
}

const CARD_ACTIONS: ContextMenuItem[] = [
  { key: "play", label: "立即播放" },
  { key: "play-next", label: "下一首播放" },
  { key: "add-to-playlist", label: "添加到播放列表" },
  { key: "open-file", label: "在文件夹中显示" },
  { key: "delete", label: "从应用删除文件", color: "danger" },
];

export const LocalMusicView = ({
  title,
  lead,
  cards,
  note,
  busy,
  selectedId,
  onPlayAll,
  onShuffle,
  onRescan,
  onDelete,
  onCardPress,
  onCardAction,
}: LocalMusicViewProps) => (
  <>
    <ScrollContainer enableBackToTop className="h-full w-full">
      <PageHeader title={title} lead={lead} leadOffset="low">
        <FilterBar label="本地音乐操作" gap="loose">
          <Button variant="primary" loading={busy} onClick={onPlayAll}>
            全部播放
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onShuffle}>
            随机播放
          </Button>
          <Button variant="neutral" disabled={busy} onClick={onRescan}>
            重新扫描
          </Button>
          <Button variant="danger" disabled={!selectedId || busy} onClick={onDelete}>
            从应用删除文件 · 二次确认
          </Button>
        </FilterBar>
      </PageHeader>
      <FormatGrid>
        {cards.map(card => (
          <ContextMenu key={card.id} items={CARD_ACTIONS} onAction={action => onCardAction(card.id, action)}>
            <FormatCard
              format={card.format}
              title={card.title}
              meta={card.meta}
              badge={card.badge}
              onPress={() => onCardPress(card.id)}
            />
          </ContextMenu>
        ))}
      </FormatGrid>
    </ScrollContainer>
    {note ? <AnnotationBand anchor="lower">{note}</AnnotationBand> : null}
  </>
);
