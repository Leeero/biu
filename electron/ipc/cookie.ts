import { session } from "electron";

import { handleTrustedIpc } from "../security/ipc";
import { parseCookieName, parseCookiePayload } from "../security/validation";
import { channel } from "./channel";

export function registerCookieIpcHandlers() {
  handleTrustedIpc(channel.cookie.get, async (_, key: string) => {
    const cookies = await session.defaultSession.cookies.get({ name: parseCookieName(key), domain: ".bilibili.com" });

    return cookies?.[0]?.value;
  });

  handleTrustedIpc(channel.cookie.set, async (_, payload: { name: string; value: string; expirationDate?: number }) => {
    const { name, value, expirationDate } = parseCookiePayload(payload);
    await session.defaultSession.cookies.set({
      url: "https://bilibili.com/",
      domain: ".bilibili.com",
      path: "/",
      name,
      value,
      secure: true,
      sameSite: "no_restriction",
      httpOnly: false,
      expirationDate,
    });

    await session.defaultSession.cookies.flushStore();
  });
}
