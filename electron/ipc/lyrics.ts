import { handleTrustedIpc } from "../security/ipc";
import { parseLrclibSearch, parseNeteaseLyrics, parseNeteaseSearch } from "../security/validation";
import { getLyricsByLrclib } from "./api/lrclib-lyric";
import { getLyricsByNetease, getSongByNetease } from "./api/netease-lyric";
import { channel } from "./channel";

export function registerLyricsHandlers() {
  handleTrustedIpc(channel.lyrics.searchNeteaseSongs, async (_, params: SearchSongByNeteaseParams) => {
    return getSongByNetease(parseNeteaseSearch(params));
  });

  handleTrustedIpc(channel.lyrics.getNeteaseLyrics, async (_, params: GetLyricsByNeteaseParams) => {
    return getLyricsByNetease(parseNeteaseLyrics(params));
  });

  handleTrustedIpc(channel.lyrics.searchLrclib, async (_, params: SearchSongByLrclibParams) => {
    return getLyricsByLrclib(parseLrclibSearch(params));
  });
}
