import React, { useEffect, useRef, useState } from "react";

import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiMore2Fill, RiSearchLine } from "@remixicon/react";

import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import VirtualGridPageList from "@/components/virtual-grid-page-list";
import { getRelationFollowings, type RelationListItem } from "@/service/relation-followings";
import {
  deleteRelationTag,
  getRelationTag,
  getRelationTags,
  searchFollowings,
  type RelationTag,
  type RelationTagUser,
} from "@/service/relation-tag";
import { useModalStore } from "@/store/modal";
import { useUser } from "@/store/user";
import { PageState } from "@/ui/states/page-state";

import GroupModal from "./group-modal";
import SetGroupModal from "./set-group-modal";
import UserCard from "./user-card";

const PAGE_SIZE = 20;

const FollowList = () => {
  const user = useUser(s => s.user);
  const onOpenConfirmModal = useModalStore(s => s.onOpenConfirmModal);
  const scrollRef = useRef<ScrollRefObject>(null);

  const [list, setList] = useState<(RelationListItem | RelationTagUser)[]>([]);
  const [tags, setTags] = useState<RelationTag[]>([]);
  const [allCount, setAllCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");

  const onSearchChange = (val: string) => {
    setInputValue(val);
  };

  const onSearchSubmit = () => {
    setSearchKeyword(inputValue);
  };

  const onClear = () => {
    setInputValue("");
    setSearchKeyword("");
  };

  // Modal State for Create/Rename
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [modalMode, setModalMode] = useState<"create" | "rename">("create");
  const [currentTag, setCurrentTag] = useState<RelationTag | null>(null);

  // Modal State for Set Group
  const setGroupModalDisclosure = useDisclosure();
  const [currentOperatingUser, setCurrentOperatingUser] = useState<RelationListItem | RelationTagUser | null>(null);

  // Derived state for current active tag
  const activeTagId = Number(activeTab);
  const isCustomTag = !isNaN(activeTagId) && activeTagId !== 0 && activeTagId !== -10;
  const activeTag = tags.find(t => t.tagid === activeTagId);

  const fetchTags = async () => {
    const res = await getRelationTags();
    if (res.code === 0) {
      setTags(res.data);
    }
  };

  useEffect(() => {
    if (user?.mid) {
      fetchTags();
    }
  }, [user?.mid]);

  const fetchData = async (pn: number = 1) => {
    if (!user?.mid) return;

    let newList: (RelationListItem | RelationTagUser)[] = [];
    let total = 0;
    let failed = false;

    if (activeTab === "all") {
      const res = searchKeyword
        ? await searchFollowings({ vmid: user.mid, pn, ps: PAGE_SIZE, name: searchKeyword })
        : await getRelationFollowings({ vmid: user.mid, pn, ps: PAGE_SIZE });

      if (res.code === 0) {
        setAllCount(res.data.total);
        if (res?.data?.list?.length) {
          total = res?.data?.total ?? 0;
          newList = res?.data?.list ?? [];
        }
      } else {
        failed = true;
      }
    } else {
      const tagId = Number(activeTab);
      const res = await getRelationTag({ tagid: tagId, pn, ps: PAGE_SIZE });
      if (res.code === 0) {
        newList = res.data ?? [];
        const tag = tags.find(t => t.tagid === tagId);
        total = tag?.count ?? 0;
      } else {
        failed = true;
      }
    }

    if (failed) {
      // 请求失败：仅首页失败时展示错误态；加载更多失败保持现有列表并提示。
      if (pn === 1) {
        setList([]);
        setLoadError(true);
      } else {
        addToast({ title: "加载失败，请稍后重试", color: "danger" });
      }
      setHasMore(pn > 1);
      return;
    }

    setLoadError(false);
    if (newList.length > 0) {
      const combinedList = pn === 1 ? newList : [...list, ...newList];

      setList(combinedList);
      setHasMore(combinedList.length < total);
      setPage(pn);
    } else {
      if (pn === 1) setList([]);
      setHasMore(false);
    }
  };

  const init = async () => {
    try {
      setLoading(true);
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.mid) {
      setLoadError(false);
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.mid, activeTab, searchKeyword]);

  const reload = async () => {
    setList([]);
    setHasMore(true);
    await init();
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      await fetchData(page + 1);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setCurrentTag(null);
    onOpen();
  };

  // Open Rename Modal
  const handleOpenRename = (tag: RelationTag) => {
    setModalMode("rename");
    setCurrentTag(tag);
    onOpen();
  };

  // Open Delete Modal
  const handleOpenDelete = (tag: RelationTag) => {
    onOpenConfirmModal({
      title: `删除分组${tag.name}`,
      type: "danger",
      confirmText: "删除",
      onConfirm: async () => {
        try {
          const res = await deleteRelationTag({ tagid: tag.tagid });
          if (res.code === 0) {
            addToast({ title: "删除分组成功", color: "success" });
            if (activeTab === String(tag.tagid)) {
              setActiveTab("all");
            }
            fetchTags();
            return true;
          } else {
            addToast({ title: res.message || "删除分组失败", color: "danger" });
            return false;
          }
        } catch {
          addToast({ title: "删除分组失败", color: "danger" });
          return false;
        }
      },
    });
  };

  const handleOpenSetGroup = (u: RelationListItem | RelationTagUser) => {
    setCurrentOperatingUser(u);
    setGroupModalDisclosure.onOpen();
  };

  const renderTagMenu = (tag: RelationTag) => (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          radius="md"
          size="sm"
          variant="light"
          aria-label={`分组操作：${tag.name}`}
          className="data-[hover=true]:bg-transparent"
        >
          <RiMore2Fill size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={`分组操作：${tag.name}`} variant="flat">
        <DropdownItem key="rename" startContent={<RiEditLine size={18} />} onPress={() => handleOpenRename(tag)}>
          修改分组名称
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          color="danger"
          startContent={<RiDeleteBinLine size={18} />}
          onPress={() => handleOpenDelete(tag)}
        >
          删除分组
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  return (
    <>
      <div className="social4188-follow flex h-full w-full">
        <div className="social4188-follow-aside h-full w-50 pb-4">
          <div className="border-divider/40 flex h-full flex-col border-r">
            <div className="mb-2 flex items-center justify-between space-x-1 px-4">
              <h1 className="min-w-0 truncate">{activeTab === "all" ? "全部关注" : activeTag?.name || "我的关注"}</h1>
              <div className="flex items-center">
                <Tooltip content="创建分组" closeDelay={0}>
                  <Button size="sm" radius="md" onPress={handleOpenCreate} isIconOnly variant="light">
                    <RiAddLine size={20} />
                  </Button>
                </Tooltip>
              </div>
            </div>
            <ScrollContainer className="h-full min-h-0 w-full flex-1 px-2">
              <div className="flex min-h-0 flex-1 flex-col">
                <Button
                  fullWidth
                  radius="md"
                  variant={activeTab === "all" ? "flat" : "light"}
                  className="justify-between px-3"
                  onPress={() => setActiveTab("all")}
                >
                  <span className="truncate">{`全部关注${allCount ? `(${allCount})` : ""}`}</span>
                </Button>
                {tags.map(tag => {
                  const key = String(tag.tagid);
                  const isActive = activeTab === key;
                  return (
                    <div
                      key={key}
                      className={`group/tag flex w-full items-center justify-between gap-1 rounded-md transition-colors ${
                        isActive ? "bg-default-100" : "hover:bg-default-100/60"
                      }`}
                    >
                      <Button
                        fullWidth
                        radius="md"
                        variant="light"
                        className="min-w-0 flex-1 justify-start px-3 data-[hover=true]:bg-transparent"
                        onPress={() => setActiveTab(key)}
                      >
                        <span className="truncate">{`${tag.name}${tag.count ? `(${tag.count})` : ""}`}</span>
                      </Button>
                      {/* 操作入口跟分组走：hover / 键盘 focus 时可见，选中时常驻。
                          视觉背景统一由外层容器承担，内层按钮一律透明，避免多段色块拼接。 */}
                      <div
                        className={`flex-none pr-1 transition-opacity duration-200 ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-focus-within/tag:opacity-100 group-hover/tag:opacity-100"
                        }`}
                      >
                        {renderTagMenu(tag)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollContainer>
          </div>
        </div>

        <div className="flex min-w-0 flex-1">
          <ScrollContainer ref={scrollRef} enableBackToTop className="h-full w-full px-4">
            <div className="flex h-full flex-col">
              {/* 工具栏位置恒定：搜索框常驻（分组视图下禁用），避免布局跳变。 */}
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center space-x-1">
                  {isCustomTag && activeTag && (
                    <span className="text-default-500 truncate text-sm">
                      {activeTag.name}
                      {activeTag.count ? ` · ${activeTag.count} 人` : ""}
                    </span>
                  )}
                </div>
                <Tooltip
                  content={activeTab === "all" ? "" : "分组内暂不支持搜索，切回全部关注可搜索"}
                  closeDelay={0}
                  isDisabled={activeTab === "all"}
                >
                  <div className="flex items-center">
                    <Input
                      classNames={{
                        base: "w-64",
                        inputWrapper: "h-10",
                      }}
                      placeholder="搜索关注"
                      size="sm"
                      radius="md"
                      startContent={<RiSearchLine size={16} />}
                      value={inputValue}
                      onValueChange={onSearchChange}
                      isClearable
                      isDisabled={activeTab !== "all"}
                      onClear={onClear}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          onSearchSubmit();
                        }
                      }}
                    />
                  </div>
                </Tooltip>
              </div>

              {loading && !list.length ? (
                <div className="flex h-[40vh] items-center justify-center">
                  <Spinner label="加载中" />
                </div>
              ) : loadError ? (
                <PageState
                  kind="error"
                  title="关注列表加载失败"
                  description="可能是网络波动或接口限流，稍后重试看看"
                  actionLabel="重新加载"
                  onAction={reload}
                />
              ) : (
                <VirtualGridPageList
                  items={list}
                  itemKey="mid"
                  renderItem={item => <UserCard u={item} refresh={reload} onSetGroup={handleOpenSetGroup} />}
                  getScrollElement={() => scrollRef.current?.osInstance()?.elements().viewport || null}
                  onLoadMore={loadMore}
                  rowHeight={240}
                  hasMore={hasMore}
                  loading={loading}
                />
              )}
            </div>
          </ScrollContainer>
        </div>
      </div>
      <GroupModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        mode={modalMode}
        tag={currentTag}
        onSuccess={fetchTags}
      />

      <SetGroupModal
        isOpen={setGroupModalDisclosure.isOpen}
        onOpenChange={setGroupModalDisclosure.onOpenChange}
        onClose={setGroupModalDisclosure.onClose}
        user={currentOperatingUser}
        tags={tags}
        onSuccess={reload}
      />
    </>
  );
};

export default FollowList;
