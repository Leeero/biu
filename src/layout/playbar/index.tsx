import { useEffect } from "react";

import { usePlayList } from "@/store/play-list";

import Center from "./center";
import Left from "./left";
import Right from "./right";

/**
 * 播放任务栏
 */
function PlayBar() {
  const playId = usePlayList(s => s.playId);
  const init = usePlayList(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="grid h-full grid-cols-[minmax(260px,1fr)_minmax(360px,1.4fr)_minmax(300px,1fr)] bg-transparent px-5">
      <div className="h-full">{Boolean(playId) && <Left />}</div>
      <Center />
      <Right />
    </div>
  );
}

export default PlayBar;
