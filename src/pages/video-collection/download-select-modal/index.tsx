import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Checkbox, addToast } from "@heroui/react";
import clx from "classnames";

import type { Track } from "@/domain/track";

import { toMediaDownloadInfo } from "@/adapters/track/actions";
import { CollectionType } from "@/common/constants/collection";
import Image from "@/components/image";
import ScrollContainer from "@/components/scroll-container";
import { loadAllPlaylistTracks, type PlaylistTrackSource } from "@/features/playlist/load-tracks";

interface DownloadSelectModalProps {
  type: CollectionType;
  outputFileType: MediaDownloadOutputFileType;
  mediaCount?: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DownloadSelectModal = ({ type, outputFileType, mediaCount, isOpen, onOpenChange }: DownloadSelectModalProps) => {
  const { id } = useParams();
  const [list, setList] = useState<Track[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getMedias = useCallback(async () => {
    if (!id) return;
    const source: PlaylistTrackSource =
      type === CollectionType.Favorite
        ? "favorite-folder"
        : type === CollectionType.VideoCollections
          ? "season"
          : "series";
    const tracks = await loadAllPlaylistTracks(source, id);
    const downloadable = tracks.filter(track => outputFileType !== "video" || track.source === "bilibili-video");
    setList(downloadable);
    setSelectedIds(downloadable.map(track => track.id));
  }, [id, outputFileType, type]);

  const handleDownload = async () => {
    if (selectedIds.length) {
      await window.electron.addMediaDownloadTaskList(
        selectedIds
          .map(id => list.find(item => item.id === id))
          .filter((track): track is Track => Boolean(track))
          .map(track => toMediaDownloadInfo(track, outputFileType))
          .filter((task): task is MediaDownloadInfo => Boolean(task)),
      );

      onOpenChange(false);
      addToast({
        title: "下载任务已添加",
        color: "success",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      getMedias();
    }
  }, [getMedias, isOpen, mediaCount]);

  return (
    <Modal radius="md" disableAnimation scrollBehavior="inside" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>选择要下载的{outputFileType === "audio" ? "音频" : "视频"}</ModalHeader>
        <ModalBody className="px-0">
          <ScrollContainer className="px-4">
            {list.map(item => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  aria-label={item.title}
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedIds(prev => prev.filter(id => id !== item.id));
                    } else {
                      setSelectedIds(prev => [...prev, item.id]);
                    }
                  }}
                  className={clx(
                    "rounded-medium hover:bg-content2 border-content2 flex w-full cursor-default items-center justify-between border-1 px-4 py-2 not-last:mb-2",
                    {
                      "border-primary": isSelected,
                    },
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center">
                    <Image
                      radius="md"
                      src={item.cover}
                      alt={item.title}
                      className="h-12 w-12 flex-none"
                      params="672w_378h_1c.avif"
                    />
                    <span className="ml-2 min-w-0 flex-1 truncate">{item.title}</span>
                  </div>
                  <Checkbox color="primary" disableAnimation isSelected={isSelected} className="ml-2" />
                </div>
              );
            })}
          </ScrollContainer>
        </ModalBody>
        <ModalFooter>
          <Checkbox
            color="primary"
            disableAnimation
            isSelected={selectedIds.length === list.length}
            onValueChange={checked => {
              if (checked) {
                setSelectedIds(list.map(item => item.id));
              } else {
                setSelectedIds([]);
              }
            }}
            className="mr-2"
          >
            全选
          </Checkbox>
          <Button color="primary" onPress={handleDownload}>
            下载
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DownloadSelectModal;
