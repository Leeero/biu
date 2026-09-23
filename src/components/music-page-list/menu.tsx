import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, useDisclosure } from "@heroui/react";
import { RiDeleteBinLine, RiExternalLinkLine, RiMoreFill } from "@remixicon/react";

import { openBiliVideoLink } from "@/common/utils/url";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { type PlayData } from "@/store/play-list";

interface Props {
  data: PlayData;
}

const Menus = ({ data }: Props) => {
  const { removeQueueItem } = usePlayerActions();
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Dropdown
        disableAnimation
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          content: "min-w-fit",
        }}
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            aria-label={`更多操作 ${data.pageTitle || data.title}`}
            variant="light"
            size="sm"
            className={`flex-none transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} group-hover:pointer-events-auto group-hover:opacity-100`}
          >
            <RiMoreFill size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="播放列表操作菜单">
          <DropdownItem
            key="bililink"
            startContent={<RiExternalLinkLine size={16} />}
            onPress={() => {
              openBiliVideoLink(data);
            }}
          >
            在 B 站打开
          </DropdownItem>
          <DropdownItem
            key="del"
            color="danger"
            startContent={<RiDeleteBinLine size={16} />}
            onPress={() => removeQueueItem(data.id)}
          >
            从列表删除
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  );
};

export default Menus;
