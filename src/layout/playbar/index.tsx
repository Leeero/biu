import { useNowPlaying } from "@/features/player/now-playing";

import Center from "./center";
import Deferred from "./deferred";
import Left from "./left";
import Right from "./right";

/** 4188 底部播放器：曲目信息、居中传输与进度、保留能力、队列入口。 */
function PlayBar() {
  const { title } = useNowPlaying();

  return (
    <div className="shell4188-player-inner">
      <div className="shell4188-player-track">{Boolean(title) && <Left />}</div>
      <div className="shell4188-player-center">
        <Center />
      </div>
      <div className="shell4188-player-tools">
        <Deferred />
        <Right />
      </div>
    </div>
  );
}

export default PlayBar;
