import type { Track } from "@/domain/track";

const toFileUrl = (path: string) => `file://${path.replace(/\\/g, "/")}`;

export const adaptLocalMusicToTrack = (item: LocalMusicItem): Track => ({
  id: `local:${item.id}`,
  source: "local",
  title: item.title,
  duration: item.duration,
  publishedAt: item.createdTime ? new Date(item.createdTime).toISOString() : undefined,
  sourceRef: {
    localPath: item.path,
    audioUrl: toFileUrl(item.path),
  },
});
