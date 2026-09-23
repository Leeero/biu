import { Button, Chip } from "@heroui/react";
import { RiHeartLine, RiMore2Line, RiPlayFill } from "@remixicon/react";

import type { PlaylistSummary } from "@/domain/playlist";
import type { Track } from "@/domain/track";

import ScrollContainer from "@/components/scroll-container";
import { ActionMenu } from "@/ui/patterns/action-menu";
import { PageHeader } from "@/ui/patterns/page-header";
import { PlaylistCard } from "@/ui/patterns/playlist-card";
import { TrackRow } from "@/ui/patterns/track-row";
import { IconButton } from "@/ui/primitives/icon-button";
import { PageState } from "@/ui/states/page-state";

const sampleTrack: Track = {
  id: "bilibili-video:design-system",
  source: "bilibili-video",
  title: "晚风经过唱片店",
  cover: "",
  creator: { id: "1", name: "Biu Music" },
  duration: 246,
  playCount: 128_000,
  publishedAt: "2026-09-22T00:00:00.000Z",
  sourceRef: { aid: "1", bvid: "BV-design-system" },
};

const samplePlaylist: PlaylistSummary = {
  id: "favorite-folder:design-system",
  source: "favorite-folder",
  title: "今天适合循环",
  creator: { id: "1", name: "Biu Music" },
  trackCount: 24,
};

const menuItems = [
  { key: "play", label: "立即播放", icon: <RiPlayFill size={18} /> },
  { key: "favorite", label: "收藏", icon: <RiHeartLine size={18} /> },
];

const DesignSystemPage = () => (
  <ScrollContainer className="h-full bg-[rgb(var(--biu-color-canvas))] px-6 pb-10">
    <div className="mx-auto max-w-[var(--biu-content-max-width)]">
      <PageHeader
        title="Biu 设计系统"
        description="仅开发环境可见，用于检查组件、主题和交互状态。"
        actions={
          <>
            <Chip color="primary" variant="flat">
              Stage 2
            </Chip>
            <IconButton label="更多设计选项">
              <RiMore2Line size={18} />
            </IconButton>
          </>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">操作</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--biu-radius-lg)] bg-[rgb(var(--biu-color-surface))] p-5 shadow-[var(--biu-shadow-card)]">
          <Button color="primary" startContent={<RiPlayFill size={18} />}>
            播放全部
          </Button>
          <Button variant="flat">次要操作</Button>
          <Button isDisabled>禁用状态</Button>
          <IconButton label="收藏歌曲">
            <RiHeartLine size={18} />
          </IconButton>
          <ActionMenu items={menuItems} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">音乐内容</h2>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-[var(--biu-radius-lg)] bg-[rgb(var(--biu-color-surface))] p-3 shadow-[var(--biu-shadow-card)]">
            <TrackRow track={sampleTrack} index={1} actions={menuItems} />
          </div>
          <PlaylistCard playlist={samplePlaylist} onPress={() => undefined} onPlay={() => undefined} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">页面状态</h2>
        <div className="grid overflow-hidden rounded-[var(--biu-radius-lg)] bg-[rgb(var(--biu-color-surface))] shadow-[var(--biu-shadow-card)] md:grid-cols-3">
          <PageState kind="loading" className="min-h-72" />
          <PageState kind="empty" className="min-h-72 border-[rgb(var(--biu-color-border)/8%)] md:border-x" />
          <PageState kind="error" actionLabel="重新加载" onAction={() => undefined} className="min-h-72" />
        </div>
      </section>
    </div>
  </ScrollContainer>
);

export default DesignSystemPage;
