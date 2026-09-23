import { useState } from "react";
import { useNavigate } from "react-router";

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { RiMoreFill, RiMusic2Line, RiPlayFill } from "@remixicon/react";
import clx from "classnames";

import Image from "@/components/image";
import { type PlayData } from "@/store/play-list";

import { getMenus } from "./menu";

interface Props {
  data: PlayData;
  isLogin: boolean;
  isPlaying?: boolean;
  onAction: (key: string) => void;
  onClose: VoidFunction;
  onPress?: VoidFunction;
}

const ListItem = ({ data, isLogin, isPlaying, onAction, onClose, onPress }: Props) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Button
      as="div"
      role="button"
      aria-label={`${isPlaying ? "正在播放" : "播放"} ${data.title}`}
      tabIndex={0}
      key={data.id}
      fullWidth
      disableAnimation
      variant={isPlaying ? "flat" : "light"}
      color={isPlaying ? "primary" : "default"}
      onPress={onPress}
      className={clx(
        "group relative flex h-[60px] min-h-[60px] w-full min-w-0 items-center justify-between overflow-hidden rounded-[var(--biu-radius-md)] p-1.5 text-left transition-colors",
        isPlaying
          ? "bg-primary/10 before:bg-primary text-[rgb(var(--biu-color-text-primary))] before:absolute before:top-1/2 before:left-0 before:h-7 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full"
          : "text-[rgb(var(--biu-color-text-primary))] hover:bg-[rgb(var(--biu-color-surface-hover))]",
      )}
    >
      <div className="m-0 flex min-w-0 flex-1 items-center">
        <div className="relative h-12 w-12 flex-none overflow-hidden rounded-[var(--biu-radius-md)]">
          <Image
            removeWrapper
            radius="md"
            src={data.cover}
            alt={data.title}
            width={48}
            height={48}
            emptyPlaceholder={<RiMusic2Line className="text-default-500" />}
          />
          {!isPlaying && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-[rgba(0,0,0,0.35)] opacity-0 group-hover:opacity-100">
              <RiPlayFill size={20} className="text-white transition-transform duration-200 group-hover:scale-110" />
            </div>
          )}
        </div>
        <div className="ml-3 flex min-w-0 flex-auto flex-col items-start gap-1 pr-1">
          <span className="w-full min-w-0 truncate text-sm font-medium">{data.title}</span>
          <span
            className={clx("w-fit max-w-full truncate text-xs text-[rgb(var(--biu-color-text-secondary))]", {
              "cursor-pointer hover:underline": Boolean(data?.ownerMid),
            })}
            onClick={e => {
              e.stopPropagation();
              if (!data?.ownerMid) return;
              navigate(`/user/${data?.ownerMid}`);
              onClose();
            }}
          >
            {data?.source === "local" ? "本地音乐" : data?.ownerName || "未知"}
          </span>
        </div>
        <Dropdown
          disableAnimation
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          classNames={{
            content: "min-w-fit",
          }}
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              aria-label={`更多操作 ${data.title}`}
              className={`flex-none transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} group-hover:pointer-events-auto group-hover:opacity-100`}
            >
              <RiMoreFill size={16} />
            </Button>
          </DropdownTrigger>

          <DropdownMenu
            aria-label="播放列表操作菜单"
            items={getMenus({ isLogin, isLocal: data.source === "local" })}
            // @ts-ignore 忽略onAction类型问题
            onAction={onAction}
          >
            {item => (
              <DropdownItem key={item.key} color={item.color} startContent={item.icon}>
                {item.label}
              </DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
      </div>
    </Button>
  );
};

export default ListItem;
