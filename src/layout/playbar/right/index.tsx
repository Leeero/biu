import MusicDownloadButton from "@/components/music-download-button";
import MusicPlayMode from "@/components/music-play-mode";
import MusicRate from "@/components/music-rate";
import MusicVolume from "@/components/music-volume";
import OpenPlaylistDrawerButton from "@/components/open-playlist-drawer-button";
import { usePlayList } from "@/store/play-list";

import QueueButton from "../queue-button";

const RightControl = () => {
  const playId = usePlayList(s => s.playId);
  const getPlayItem = usePlayList(s => s.getPlayItem);

  return (
    <div className="flex items-center justify-end gap-1 pl-4 text-[rgb(var(--biu-text-secondary))]">
      <MusicPlayMode />
      {Boolean(playId) && getPlayItem()?.source !== "local" && <MusicDownloadButton />}
      {/* 过渡期的两个队列入口：/queue 是目标形态，抽屉是兜底（P5 删除抽屉后只留前者）。 */}
      <OpenPlaylistDrawerButton />
      <QueueButton />
      <MusicVolume />
      <MusicRate />
    </div>
  );
};

export default RightControl;
