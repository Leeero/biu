import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  Radio,
  RadioGroup,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { RiDeleteBinLine, RiExternalLinkLine, RiFolderLine } from "@remixicon/react";
import { filesize } from "filesize";

import { formatMillisecond } from "@/common/utils/time";
import { openBiliVideoLink } from "@/common/utils/url";
import Empty from "@/components/empty";
import Image from "@/components/image";
import ScrollContainer from "@/components/scroll-container";
import { countDownloadStatuses, createDownloadTaskViews, type DownloadFilter } from "@/features/downloads/model";
import { useModalStore } from "@/store/modal";
import { useSettings } from "@/store/settings";
import { PageHeader } from "@/ui/patterns/page-header";

import DownloadActions from "./actions";
import DownloadProgress from "./progress";

const DownloadList = () => {
  const downloadPath = useSettings(s => s.downloadPath);
  const [downloadList, setDownloadList] = useState<MediaDownloadTask[]>([]);
  const [fileType, setFileType] = useState<DownloadFilter>("all");
  const onOpenConfirmModal = useModalStore(state => state.onOpenConfirmModal);
  const taskViews = useMemo(() => createDownloadTaskViews(downloadList, fileType), [downloadList, fileType]);
  const statusCounts = useMemo(() => countDownloadStatuses(downloadList), [downloadList]);

  useEffect(() => {
    const initList = async () => {
      const list = await window.electron.getMediaDownloadTaskList();
      if (list.length) {
        setDownloadList(list);
      }
    };

    initList();

    const removeListener = window.electron.syncMediaDownloadTaskList(payload => {
      if (payload?.type === "full") {
        setDownloadList(payload.data as MediaDownloadTask[]);
      } else if (payload?.type === "update") {
        setDownloadList(prev => {
          const updateTasks = payload.data;
          return prev.map(item => {
            const updateTask = updateTasks.find(t => t.id === item.id);
            return updateTask ? { ...item, ...updateTask } : item;
          });
        });
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  const clearDownloadList = () => {
    onOpenConfirmModal({
      title: "确认清空全部下载记录？",
      description: "进行中的任务也会被移除，该操作无法撤销",
      confirmText: "清空",
      type: "danger",
      onConfirm: async () => {
        await window.electron.clearMediaDownloadTaskList();
        return true;
      },
    });
  };

  const openDownloadDir = async () => {
    await window.electron.openDirectory(downloadPath);
  };

  const getFileQuality = (item: MediaDownloadTask) => {
    if (item.outputFileType === "video") {
      return item.videoResolution
        ? `${item.videoResolution}${item.videoFrameRate ? `@${item.videoFrameRate}` : ""}`
        : "";
    }

    if (item.audioCodecs === "flac") {
      return "flac";
    }

    if (item.audioCodecs?.includes("ec-3")) {
      return "杜比音频";
    }

    if (item.audioBandwidth) {
      return `${Math.round(item.audioBandwidth / 1000)} kbps`;
    }

    return "";
  };

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <main className="mx-auto w-full max-w-[1440px] px-6 py-5">
        <PageHeader
          title="下载管理"
          description={`${downloadList.length} 个任务 · ${statusCounts.downloading + statusCounts.processing} 个进行中 · ${statusCounts.completed} 个已完成`}
          actions={
            <Button
              className="max-w-[320px]"
              variant="flat"
              size="sm"
              onPress={openDownloadDir}
              startContent={<RiFolderLine size={18} />}
            >
              <span className="truncate">{downloadPath || "打开下载目录"}</span>
            </Button>
          }
        />
        <Card
          radius="lg"
          shadow="none"
          className="border border-[rgb(var(--biu-color-border)/0.08)] bg-[rgb(var(--biu-color-surface-raised))]"
        >
          <CardBody>
            <div className="w-full overflow-x-auto">
              <Table
                fullWidth
                radius="md"
                aria-label="下载列表"
                removeWrapper
                topContent={
                  <div className="flex justify-between">
                    <RadioGroup
                      orientation="horizontal"
                      value={fileType}
                      onValueChange={value => setFileType(value as DownloadFilter)}
                      classNames={{
                        wrapper: "gap-4",
                      }}
                    >
                      <Radio value="all">全部</Radio>
                      <Radio value="audio">音频</Radio>
                      <Radio value="video">视频</Radio>
                    </RadioGroup>
                    {Boolean(downloadList.length) && (
                      <Tooltip content="清空记录" closeDelay={0}>
                        <Button size="sm" isIconOnly onPress={clearDownloadList}>
                          <RiDeleteBinLine size={18} />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                }
                classNames={{
                  th: "first:rounded-s-medium last:rounded-e-medium",
                }}
              >
                <TableHeader className="rounded-medium">
                  <TableColumn width={350}>文件</TableColumn>
                  <TableColumn align="center">状态</TableColumn>
                  <TableColumn width={120} align="center">
                    大小
                  </TableColumn>
                  <TableColumn width={120} align="center">
                    下载时间
                  </TableColumn>
                  <TableColumn width={120} align="center">
                    操作
                  </TableColumn>
                </TableHeader>
                <TableBody
                  items={taskViews}
                  emptyContent={<Empty title={downloadList.length ? "当前筛选下没有任务" : "暂无下载任务"} />}
                >
                  {view => {
                    const item = view.source;
                    const quality = getFileQuality(item);

                    return (
                      <TableRow key={view.task.id}>
                        <TableCell className="max-w-[280px] truncate">
                          <div className="flex items-center space-x-2">
                            <Image radius="md" src={item.cover} width={48} height={48} className="mr-2 object-cover" />
                            <div className="flex min-w-0 flex-1 flex-col items-start space-y-1 overflow-hidden">
                              <div
                                className="group flex max-w-full min-w-0 cursor-pointer items-center space-x-1 hover:underline"
                                onClick={() =>
                                  openBiliVideoLink({
                                    type: item.sid ? "audio" : "mv",
                                    bvid: item.bvid,
                                    sid: item.sid,
                                  })
                                }
                              >
                                <span className="min-w-0 flex-auto truncate">{item.title}</span>
                                <RiExternalLinkLine className="w-0 flex-none group-hover:w-[16px]" />
                              </div>
                              {Boolean(quality) && (
                                <Chip size="sm" radius="sm" variant="flat">
                                  {quality}
                                </Chip>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DownloadProgress data={item} />
                        </TableCell>
                        <TableCell>{item.totalBytes ? filesize(item.totalBytes) : "-"}</TableCell>
                        <TableCell>{item.createdTime ? formatMillisecond(item.createdTime) : "-"}</TableCell>
                        <TableCell>
                          <DownloadActions data={item} />
                        </TableCell>
                      </TableRow>
                    );
                  }}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </main>
    </ScrollContainer>
  );
};

export default DownloadList;
