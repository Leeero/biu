import { RiPlayListLine } from "@remixicon/react";

import IconButton from "@/components/icon-button";
import { usePlayerActions } from "@/features/player/use-player-actions";

const OpenPlaylistDrawerButton = () => {
  const { openQueue } = usePlayerActions();

  return (
    <IconButton aria-label="打开播放列表" tooltip="播放列表" onPress={openQueue}>
      <RiPlayListLine size={18} />
    </IconButton>
  );
};

export default OpenPlaylistDrawerButton;
