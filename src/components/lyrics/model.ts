export interface LyricLine {
  time: number;
  text: string;
}

const timeTagPattern = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

export const parseLyrics = (raw?: string | null): LyricLine[] => {
  if (!raw) return [];

  const result: LyricLine[] = [];

  raw.split(/\r?\n/).forEach(line => {
    const text = line.replace(timeTagPattern, "").trim();
    if (!text) return;

    let match: RegExpExecArray | null;
    while ((match = timeTagPattern.exec(line)) !== null) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const millis = match[3] ? Number(match[3].padEnd(3, "0")) : 0;
      if (Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(millis)) continue;

      result.push({ time: Math.max(0, minutes * 60_000 + seconds * 1000 + millis), text });
    }
    timeTagPattern.lastIndex = 0;
  });

  return result.toSorted((a, b) => a.time - b.time);
};

export const getActiveLyricIndex = (lyrics: LyricLine[], currentMs: number) => {
  if (!lyrics.length) return -1;
  for (let index = lyrics.length - 1; index >= 0; index -= 1) {
    if (currentMs >= lyrics[index].time) return index;
  }
  return 0;
};
