import { getFonts2 } from "font-list";

import { handleTrustedIpc } from "../security/ipc";
import { channel } from "./channel";

export function registerFontHandlers() {
  handleTrustedIpc(channel.font.getFonts, async () => {
    return getFonts2();
  });
}
