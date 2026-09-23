import { useState } from "react";

import { Input } from "@heroui/react";
import { RiArrowRightSLine, RiSearchLine } from "@remixicon/react";
import { twMerge } from "tailwind-merge";

import IconButton from "@/components/icon-button";
import MusicPageList from "@/components/music-page-list";

interface Props {
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
}

const FullScreenPageList = ({
  ref,
  className,
  style,
  onClose,
}: Props & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <div
      ref={ref}
      className={twMerge(
        "flex flex-col overflow-hidden rounded-[var(--biu-radius-xl)] border border-white/10 bg-black/20 text-white shadow-[var(--biu-shadow-floating)] backdrop-blur-xl",
        className,
      )}
      style={style}
    >
      <div className="flex w-full flex-none flex-row items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
        <Input
          aria-label="搜索分集"
          classNames={{
            mainWrapper: "h-full",
            input: "text-sm outline-none focus-visible:outline-none",
            inputWrapper:
              "h-9 rounded-full bg-white/8 px-3 hover:bg-white/12 group-data-[focus=true]:bg-white/12 group-data-[focus-visible=true]:ring-0",
          }}
          placeholder="搜索分集"
          size="sm"
          startContent={<RiSearchLine size={16} />}
          type="search"
          value={searchKeyword}
          onValueChange={setSearchKeyword}
        />
        <IconButton
          aria-label="关闭分集列表"
          tooltip="关闭"
          variant="flat"
          onPress={onClose}
          className="w-8 min-w-8 rounded-full"
        >
          <RiArrowRightSLine size={16} className="text-white/80" />
        </IconButton>
      </div>
      <MusicPageList
        className="h-full w-full flex-1 p-2"
        hideCover
        itemClassName="hover:bg-white/10 data-[active=true]:bg-primary/20 text-foreground/80 data-[active=true]:text-primary h-10 min-h-10 rounded-lg px-2 [&_span.tabular-nums]:hidden"
        itemHeight={44}
        itemTitleClassName="text-sm font-medium"
        onPressItem={onClose}
        searchKeyword={searchKeyword}
      />
    </div>
  );
};

export default FullScreenPageList;
