import type { MiniPlayerCommandFromMini, MiniPlayerMessageFromMini } from "@/common/utils/mini-player";

type PostMiniPlayerMessage = (message: MiniPlayerMessageFromMini) => void;

export const createMiniPlayerActions = (postMessage: PostMiniPlayerMessage) => {
  const send = (type: MiniPlayerCommandFromMini, state?: { currentTime: number }) => {
    postMessage({ from: "mini", data: { type, state }, ts: Date.now() });
  };

  return {
    initialize: () => send("init"),
    seek: (seconds: number) => send("seek", { currentTime: seconds }),
    togglePlayMode: () => send("togglePlayMode"),
    previous: () => send("prev"),
    togglePlay: () => send("togglePlay"),
    next: () => send("next"),
  };
};
