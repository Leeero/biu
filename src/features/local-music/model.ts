import { filesize } from "filesize";

import type { Track } from "@/domain/track";
import type { AudioFormat } from "@/ui/patterns/format-card";

import { adaptLocalMusicToTrack } from "@/adapters/track/local";
import { formatDuration, formatMillisecond } from "@/common/utils/time";

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

const AUDIO_FORMATS = new Set<AudioFormat>(["mp3", "flac", "wav", "m4a", "aac", "ogg", "wma", "aiff"]);

export const getLocalAudioFormat = (item: LocalMusicItem): AudioFormat => {
  const normalized = item.format.toLocaleLowerCase() as AudioFormat;
  return AUDIO_FORMATS.has(normalized) ? normalized : "mp3";
};

export const adaptLocalMusicCard = (item: LocalMusicItem) => ({
  id: `local:${item.id}`,
  format: getLocalAudioFormat(item),
  title: item.title,
  meta: `${typeof item.duration === "number" ? formatDuration(Math.round(item.duration)) : "--:--"} · ${filesize(item.size, { standard: "si" })} · ${item.createdTime ? `创建于 ${formatMillisecond(item.createdTime)}` : "创建时间未知"}`,
  badge: getLocalDirectoryName(item.dir),
});
