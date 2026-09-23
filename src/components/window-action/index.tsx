import { useEffect, useState } from "react";

import {
  RiCloseLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiPictureInPicture2Line,
  RiSubtractLine,
} from "@remixicon/react";

import { toggleMiniMode } from "@/common/utils/mini-player";
import IconButton from "@/components/icon-button";

const WindowAction = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    window.electron.isMaximized().then(setIsMaximized);
    window.electron.isFullScreen().then(setIsFullScreen);
    const unlistenMaximize = window.electron.onWindowMaximizeChange(setIsMaximized);
    const unlistenFullScreen = window.electron.onWindowFullScreenChange(setIsFullScreen);

    return () => {
      unlistenMaximize();
      unlistenFullScreen();
    };
  }, []);

  const handleMinimize = () => {
    window.electron.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electron.toggleMaximizeWindow();
  };

  const handleClose = () => {
    window.electron.closeWindow();
  };

  return (
    <div className="window-no-drag flex items-center justify-center">
      {!isFullScreen && (
        <>
          <IconButton aria-label="切换到迷你播放器" tooltip="迷你播放器" onPress={toggleMiniMode}>
            <RiPictureInPicture2Line size={16} />
          </IconButton>
          <IconButton aria-label="最小化窗口" onPress={handleMinimize}>
            <RiSubtractLine size={18} />
          </IconButton>
          <IconButton aria-label={isMaximized ? "还原窗口" : "最大化窗口"} onPress={handleMaximize}>
            {isMaximized ? <RiFullscreenExitLine size={14} /> : <RiFullscreenLine size={14} />}
          </IconButton>
          <IconButton aria-label="关闭窗口" onPress={handleClose}>
            <RiCloseLine size={18} />
          </IconButton>
        </>
      )}
    </div>
  );
};

export default WindowAction;
