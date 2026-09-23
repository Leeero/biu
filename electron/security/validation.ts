import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const boundedString = (max: number) => z.string().trim().min(1).max(max);

const absolutePathSchema = boundedString(4096).refine(value => path.isAbsolute(value), "必须使用绝对路径");

const proxySettingsSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }).strip(),
  z
    .object({
      type: z.enum(["http", "socks4", "socks5"]),
      host: boundedString(255).refine(value => !/[\s/:@]/u.test(value), "代理主机格式无效"),
      port: z.number().int().min(1).max(65535),
      username: z.string().max(512).optional(),
      password: z.string().max(512).optional(),
    })
    .strip(),
]);

const shortcutCommandSchema = z.enum([
  "togglePlay",
  "prev",
  "next",
  "volumeUp",
  "volumeDown",
  "toggleMiniMode",
  "toggleLyrics",
]);

const storeNameSchema = z.enum(["app-settings", "user-login-info", "shortcut-settings", "lyrics-cache"]);

const downloadMediaSchema = z
  .object({
    outputFileType: z.enum(["audio", "video"]),
    title: boundedString(500),
    cover: z.string().url().max(4096).optional(),
    bvid: boundedString(64).optional(),
    cid: z.union([boundedString(64), z.number().finite()]).optional(),
    sid: z.union([boundedString(64), z.number().finite()]).optional(),
  })
  .strip();

const lyricSearchText = boundedString(300);

const neteaseSearchSchema = z
  .object({
    s: lyricSearchText,
    type: z.number().int().min(1).max(1000),
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().min(0).max(100_000),
  })
  .strip();

const lrclibSearchSchema = z
  .object({
    q: lyricSearchText,
    track_name: lyricSearchText.optional(),
    artist_name: lyricSearchText.optional(),
    album_name: lyricSearchText.optional(),
  })
  .strip();

export const parseAbsolutePath = (value: unknown) => absolutePathSchema.parse(value);

export const parseAbsolutePaths = (value: unknown, maxItems = 64) =>
  z.array(absolutePathSchema).max(maxItems).parse(value);

export const parseOptionalDialogTitle = (value: unknown) => {
  if (value === undefined) return undefined;
  return boundedString(120).parse(value);
};

export const parseExternalUrl = (value: unknown) => {
  const raw = boundedString(4096).parse(value);
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error("仅允许打开 HTTPS 外部链接");
  }
  return url.toString();
};

export const parseProxySettings = (value: unknown): ProxySettings => proxySettingsSchema.parse(value);

export const parseShortcutRegistration = (value: unknown) =>
  z
    .object({
      id: shortcutCommandSchema,
      accelerator: boundedString(128),
    })
    .strip()
    .parse(value);

export const parseShortcutCommand = (value: unknown): ShortcutCommand => shortcutCommandSchema.parse(value);

export const parseCookieName = (value: unknown) =>
  boundedString(256)
    .regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u, "Cookie 名称格式无效")
    .parse(value);

export const parseCookiePayload = (value: unknown) =>
  z
    .object({
      name: boundedString(256).regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u, "Cookie 名称格式无效"),
      value: z.string().max(4096),
      expirationDate: z.number().finite().positive().optional(),
    })
    .strip()
    .parse(value);

export const parseDownloadId = (value: unknown) => boundedString(128).parse(value);

export const parseDownloadMedia = (value: unknown): MediaDownloadInfo => downloadMediaSchema.parse(value);

export const parseDownloadMediaList = (value: unknown): MediaDownloadInfo[] =>
  z.array(downloadMediaSchema).min(1).max(100).parse(value);

export const parseStoreName = (value: unknown): StoreName => storeNameSchema.parse(value) as StoreName;

export const parseStoreValue = (value: unknown) => z.record(z.string(), z.unknown()).parse(value);

export const parseNeteaseSearch = (value: unknown): SearchSongByNeteaseParams => neteaseSearchSchema.parse(value);

export const parseNeteaseLyrics = (value: unknown): GetLyricsByNeteaseParams =>
  z.object({ id: z.number().int().positive() }).strip().parse(value);

export const parseLrclibSearch = (value: unknown): SearchSongByLrclibParams => lrclibSearchSchema.parse(value);

export const isTrustedAppNavigation = (targetUrl: string, indexPath: string) => {
  try {
    const url = new URL(targetUrl);
    if (url.protocol !== "file:") return false;
    return path.resolve(fileURLToPath(url)) === path.resolve(indexPath);
  } catch {
    return false;
  }
};
