import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";

import {
  isTrustedAppNavigation,
  parseAbsolutePath,
  parseAbsolutePaths,
  parseCookiePayload,
  parseDownloadMedia,
  parseExternalUrl,
  parseLrclibSearch,
  parseNeteaseLyrics,
  parseNeteaseSearch,
  parseProxySettings,
  parseShortcutRegistration,
  parseStoreName,
} from "../electron/security/validation";

describe("Electron security validation", () => {
  test("only permits HTTPS external links", () => {
    expect(parseExternalUrl("https://www.bilibili.com/video/BV1")).toBe("https://www.bilibili.com/video/BV1");
    expect(() => parseExternalUrl("http://example.com")).toThrow();
    expect(() => parseExternalUrl("file:///tmp/example")).toThrow();
    expect(() => parseExternalUrl("javascript:alert(1)")).toThrow();
  });

  test("requires bounded absolute file-system paths", () => {
    expect(parseAbsolutePath("/Users/demo/Music/song.mp3")).toBe("/Users/demo/Music/song.mp3");
    expect(() => parseAbsolutePath("../song.mp3")).toThrow();
    expect(() => parseAbsolutePaths(new Array(65).fill("/tmp/music"))).toThrow();
  });

  test("accepts only complete, valid proxy settings", () => {
    expect(parseProxySettings({ type: "none", host: "ignored" })).toEqual({ type: "none" });
    expect(parseProxySettings({ type: "http", host: "127.0.0.1", port: 7890 })).toMatchObject({
      type: "http",
      host: "127.0.0.1",
      port: 7890,
    });
    expect(() => parseProxySettings({ type: "http", host: "https://proxy.test", port: 7890 })).toThrow();
    expect(() => parseProxySettings({ type: "socks5", host: "localhost", port: 70000 })).toThrow();
  });

  test("allows navigation only to the packaged application document", () => {
    const indexPath = path.resolve("/tmp/biu/dist/web/index.html");
    expect(isTrustedAppNavigation(`${pathToFileURL(indexPath).toString()}#/settings`, indexPath)).toBe(true);
    expect(isTrustedAppNavigation(pathToFileURL(path.resolve("/tmp/biu/other.html")).toString(), indexPath)).toBe(
      false,
    );
    expect(isTrustedAppNavigation("https://example.com", indexPath)).toBe(false);
  });

  test("validates privileged IPC payloads", () => {
    expect(parseShortcutRegistration({ id: "next", accelerator: "CommandOrControl+Right" })).toMatchObject({
      id: "next",
    });
    expect(() => parseShortcutRegistration({ id: "runShell", accelerator: "A" })).toThrow();
    expect(parseCookiePayload({ name: "x-bili-gaia-vtoken", value: "token" })).toMatchObject({ value: "token" });
    expect(() => parseCookiePayload({ name: "invalid name", value: "token" })).toThrow();
    expect(parseDownloadMedia({ outputFileType: "audio", title: "Song", sid: 1 })).toMatchObject({ title: "Song" });
    expect(() => parseDownloadMedia({ outputFileType: "binary", title: "Song" })).toThrow();
    expect(parseStoreName("app-settings")).toBe("app-settings");
    expect(() => parseStoreName("arbitrary-store")).toThrow();
  });

  test("bounds lyric provider requests", () => {
    expect(parseNeteaseSearch({ s: "Song", type: 1, limit: 20, offset: 0 })).toMatchObject({ limit: 20 });
    expect(parseNeteaseLyrics({ id: 123 })).toEqual({ id: 123 });
    expect(parseLrclibSearch({ q: "Song" })).toEqual({ q: "Song" });
    expect(() => parseNeteaseSearch({ s: "Song", type: 1, limit: 1000, offset: 0 })).toThrow();
    expect(() => parseNeteaseLyrics({ id: "123" })).toThrow();
    expect(() => parseLrclibSearch({ q: "" })).toThrow();
  });
});
