import React, { useState } from "react";

import { Input, Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@heroui/react";
import { RiListRadio, RiSearchLine } from "@remixicon/react";

import IconButton from "@/components/icon-button";
import MusicPageList from "@/components/music-page-list";

const PageListDrawer = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  return (
    <Popover
      shadow="lg"
      disableAnimation
      placement="top"
      offset={28}
      radius="md"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger>
        <IconButton aria-label="打开分集列表" tooltip="分集" onPress={onOpen}>
          <RiListRadio size={18} />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[500px] overflow-hidden border border-[rgb(var(--biu-color-border)/0.08)] bg-[rgb(var(--biu-color-surface-raised))] p-0 shadow-[var(--biu-shadow-floating)]"
        style={{ maxWidth: "min(500px, 90vw)" }}
      >
        <div className="flex w-full flex-row items-center justify-between gap-3 border-b border-[rgb(var(--biu-color-border)/0.08)] px-4 py-3">
          <div>
            <h3 className="font-semibold">分集列表</h3>
            <p className="text-xs text-[rgb(var(--biu-color-text-tertiary))]">选择当前视频中的音轨</p>
          </div>
          <Input
            aria-label="搜索分集"
            classNames={{
              base: "max-w-48 h-8",
              mainWrapper: "h-full",
              input: "text-small outline-none focus-visible:outline-none",
              inputWrapper:
                "h-full rounded-full bg-[rgb(var(--biu-color-surface-hover))] font-normal text-[rgb(var(--biu-color-text-secondary))] group-data-[focus-visible=true]:ring-0",
            }}
            placeholder="搜索分集"
            size="sm"
            startContent={<RiSearchLine size={14} />}
            type="search"
            value={searchKeyword}
            onValueChange={setSearchKeyword}
          />
        </div>
        <MusicPageList
          searchKeyword={searchKeyword}
          onPressItem={onClose}
          className="h-[60vh] w-full px-2"
          itemHeight={64}
        />
      </PopoverContent>
    </Popover>
  );
};

export default PageListDrawer;
