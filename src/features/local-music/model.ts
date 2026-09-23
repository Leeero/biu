import type { Track } from "@/domain/track";

import { adaptLocalMusicToTrack } from "@/adapters/track/local";

export interface LocalTrackEntry {
  id: string;
  track: Track;
  source: LocalMusicItem;
}

export const filterLocalMusic = (items: LocalMusicItem[], selectedDir: string, keyword: string) => {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  return items.filter(item => {
    const inDirectory = selectedDir === "all" || item.dir === selectedDir;
    const matchesKeyword = !normalizedKeyword || item.title.toLocaleLowerCase().includes(normalizedKeyword);
    return inDirectory && matchesKeyword;
  });
};

export const createLocalTrackEntries = (items: LocalMusicItem[]): LocalTrackEntry[] =>
  items.map(item => ({ id: `local:${item.id}`, track: adaptLocalMusicToTrack(item), source: item }));

export const getLocalDirectoryName = (path: string) => {
  const trimmed = path.replace(/[\\/]+$/, "");
  const parts = trimmed.split(/[/\\]/);
  return parts[parts.length - 1] || trimmed;
};
