import { Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { RiMore2Line } from "@remixicon/react";

import type { ContextMenuItem } from "@/components/context-menu";

import { IconButton } from "@/ui/primitives/icon-button";

interface ActionMenuProps {
  label?: string;
  items: ContextMenuItem[];
  onAction?: (key: string) => void;
}

export const ActionMenu = ({ label = "更多操作", items, onAction }: ActionMenuProps) => (
  <Popover placement="bottom-end" offset={6} radius="lg">
    <PopoverTrigger>
      <span>
        <IconButton label={label} size="sm">
          <RiMore2Line size={18} />
        </IconButton>
      </span>
    </PopoverTrigger>
    <PopoverContent className="min-w-40 border border-[rgb(var(--biu-color-border)/8%)] bg-[rgb(var(--biu-color-surface-raised))] p-1 shadow-[var(--biu-shadow-floating)]">
      <Listbox aria-label={label} selectionMode="none" onAction={key => onAction?.(String(key))}>
        {items
          .filter(item => !item.hidden)
          .map(item => (
            <ListboxItem key={item.key} startContent={item.icon} color={item.color} className={item.className}>
              {item.label}
            </ListboxItem>
          ))}
      </Listbox>
    </PopoverContent>
  </Popover>
);
