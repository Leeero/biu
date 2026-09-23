import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { Button, useDisclosure } from "@heroui/react";
import { RiArrowLeftDoubleLine, RiArrowRightDoubleLine } from "@remixicon/react";
import clx from "classnames";

import FavoritesEditModal from "@/components/favorites-edit-modal";
import ScrollContainer from "@/components/scroll-container";
import { useSettings } from "@/store/settings";

import Collection from "./collection";
import DefaultMenus from "./default-menu";
import Logo from "./logo";
import {
  getSidebarResizeResult,
  getSidebarWidth,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "./model";

const SideNav = () => {
  const sideMenuCollapsed = useSettings(state => state.sideMenuCollapsed);
  const sideMenuWidth = useSettings(state => state.sideMenuWidth);
  const updateSettings = useSettings(state => state.update);

  const {
    isOpen: isFavoritesEditModalOpen,
    onOpen: onOpenFavoritesEditModal,
    onOpenChange: onOpenChangeFavoritesEditModal,
  } = useDisclosure();
  const [editingFavoriteId, setEditingFavoriteId] = useState<number>();

  const handleOpenAddFavorite = () => {
    setEditingFavoriteId(undefined);
    onOpenFavoritesEditModal();
  };

  const handleOpenEditFavorite = (id: number) => {
    setEditingFavoriteId(id);
    onOpenFavoritesEditModal();
  };

  const handleFavoritesEditModalChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingFavoriteId(undefined);
    }

    onOpenChangeFavoritesEditModal();
  };

  const sidebarWidth = getSidebarWidth(sideMenuCollapsed, sideMenuWidth);

  const [renderWidth, setRenderWidth] = useState(sidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const isCollapsedVisual = isDragging ? renderWidth < SIDEBAR_MIN_WIDTH : sideMenuCollapsed;

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(sidebarWidth);
  const prevUserSelectRef = useRef<string | null>(null);

  useEffect(() => {
    startWidthRef.current = sidebarWidth;
    if (!isDragging) {
      setRenderWidth(sidebarWidth);
    }
  }, [isDragging, sidebarWidth]);

  const onToggleCollapsed = () => {
    updateSettings({ sideMenuCollapsed: !sideMenuCollapsed });
  };

  const onStartResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = event.clientX;
    startWidthRef.current = sidebarWidth;
    prevUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";
  };

  const computeWidth = (delta: number) => {
    return getSidebarResizeResult(startWidthRef.current, delta);
  };

  useEffect(() => {
    // re-clamp render width if max width shrinks while not dragging
    if (!isDragging) {
      setRenderWidth(prev => Math.min(Math.max(prev, SIDEBAR_COLLAPSED_WIDTH), SIDEBAR_MAX_WIDTH));
    }
  }, [isDragging]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const delta = event.clientX - startXRef.current;
      const { renderWidth: widthForView } = computeWidth(delta);

      setRenderWidth(widthForView);
    };

    const onMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);
      if (prevUserSelectRef.current !== null) {
        document.body.style.userSelect = prevUserSelectRef.current;
      }

      const delta = event.clientX - startXRef.current;
      const { isCollapsed: willCollapse, renderWidth: widthForView, savedWidth: widthToPersist } = computeWidth(delta);

      setRenderWidth(widthForView);
      updateSettings({ sideMenuCollapsed: willCollapse, sideMenuWidth: widthToPersist });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (isDraggingRef.current && prevUserSelectRef.current !== null) {
        document.body.style.userSelect = prevUserSelectRef.current;
      }
    };
  }, [updateSettings]);

  return (
    <>
      <aside
        aria-label="主导航"
        className={clx(
          "relative flex h-full flex-none flex-col border-r border-[rgb(var(--biu-color-border)/0.06)] bg-[rgb(var(--biu-color-surface)/0.72)] backdrop-blur-xl",
          {
            "transition-[width] duration-200": !isDragging,
            "transition-none": isDragging,
          },
        )}
        style={{ width: `${renderWidth}px` }}
      >
        <Logo isCollapsed={isCollapsedVisual} />
        <ScrollContainer
          className={clx("min-h-0 flex-1 pb-2", {
            "px-4": !isCollapsedVisual,
            "overflow-hidden": isDragging,
          })}
        >
          <DefaultMenus isCollapsed={isCollapsedVisual} onOpenAddFavorite={handleOpenAddFavorite} />
          <Collection
            isCollapsed={isCollapsedVisual}
            onOpenAddFavorite={handleOpenAddFavorite}
            onOpenEditFavorite={handleOpenEditFavorite}
          />
        </ScrollContainer>
        <Button
          aria-label={isCollapsedVisual ? "展开侧栏" : "收起侧栏"}
          size="sm"
          isIconOnly
          fullWidth
          radius="none"
          onPress={onToggleCollapsed}
          className="h-8 w-full flex-none rounded-none border-y border-[rgb(var(--biu-color-border)/0.06)] bg-transparent text-[rgb(var(--biu-color-text-secondary))] hover:bg-[rgb(var(--biu-color-surface-hover))]"
        >
          {isCollapsedVisual ? <RiArrowRightDoubleLine size={16} /> : <RiArrowLeftDoubleLine size={16} />}
        </Button>
        <div
          className="hover:bg-foreground/10 absolute top-0 right-0 h-full w-2 cursor-col-resize bg-transparent"
          onMouseDown={onStartResize}
        />
      </aside>
      <FavoritesEditModal
        mid={editingFavoriteId}
        isOpen={isFavoritesEditModalOpen}
        onOpenChange={handleFavoritesEditModalChange}
      />
    </>
  );
};

export default SideNav;
