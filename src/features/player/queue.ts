import type { PlayData } from "@/store/play-list";

export const getQueueIdentity = (item: PlayData) => {
  if (item.source === "local") return `local:${item.id}`;
  if (item.type === "mv") return `mv:${item.bvid}`;
  return `audio:${item.sid}`;
};

export const getUniqueQueueItems = (items: PlayData[]) => {
  const identities = new Set<string>();

  return items.filter(item => {
    const identity = getQueueIdentity(item);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
};
