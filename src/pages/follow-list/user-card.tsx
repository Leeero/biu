import React from "react";
import { useNavigate } from "react-router";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
} from "@heroui/react";
import { RiGroupLine, RiMore2Fill, RiUserUnfollowLine, RiVipCrownFill, RiVipFill } from "@remixicon/react";

import type { RelationListItem } from "@/service/relation-followings";
import type { RelationTagUser } from "@/service/relation-tag";

import { formatUrlProtocol } from "@/common/utils/url";
import { UserRelationAction, postRelationModify } from "@/service/relation-modify";
import { useModalStore } from "@/store/modal";

interface Props {
  u: RelationListItem | RelationTagUser;
  refresh: () => void;
  onSetGroup: (u: RelationListItem | RelationTagUser) => void;
}

/** 头像 CDN 参数：face 可能带查询参数，直接拼接会产出非法 URL，这里统一收敛。 */
const getAvatarUrl = (face?: string) => {
  const url = formatUrlProtocol(face);
  if (!url) return undefined;
  return url.includes("@") || !url.includes("/bfs/") ? url : `${url}@160w_160h_1c_1s.webp`;
};

const UserCard = ({ u, refresh, onSetGroup }: Props) => {
  const navigate = useNavigate();
  const onOpenConfirmModal = useModalStore(s => s.onOpenConfirmModal);

  const handleUnfollow = async () => {
    onOpenConfirmModal({
      title: `取消关注 ${u.uname}`,
      type: "danger",
      confirmText: "取消关注",
      onConfirm: async () => {
        try {
          const res = await postRelationModify({ fid: u.mid, act: UserRelationAction.Unfollow });
          if (res?.code !== 0) {
            addToast({
              title: "取消关注失败",
              color: "danger",
            });
            return false;
          }
          addToast({
            title: "取消关注成功",
            color: "success",
          });
          refresh();
          return true;
        } catch {
          addToast({
            title: "取消关注失败",
            color: "danger",
          });
          return false;
        }
      },
    });
  };

  const handleSetGroup = () => {
    onSetGroup(u);
  };

  const officialType = u.official_verify?.type;

  return (
    <Card
      key={u.mid}
      radius="md"
      as="div"
      isHoverable
      isPressable
      onPress={() => navigate(`/user/${u.mid}`)}
      className="social4188-person-card group relative h-full w-full overflow-hidden"
    >
      <CardBody className="flex items-center space-y-2 overflow-hidden p-4">
        <div className="relative h-32 w-32 flex-none">
          <Avatar className="text-large h-32 w-32" src={getAvatarUrl(u.face)} name={u.uname} />
          {officialType === 0 && (
            <div
              aria-label="个人认证"
              title="个人认证"
              className="bg-warning lili-theme-4188:ring-[var(--lili-4188-surface)] absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-black ring-2 ring-[rgb(var(--lili-color-surface-low))]"
            >
              <RiVipFill size={14} />
            </div>
          )}
          {officialType === 1 && (
            <div
              aria-label="机构认证"
              title="机构认证"
              className="bg-primary lili-theme-4188:ring-[var(--lili-4188-surface)] absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-white ring-2 ring-[rgb(var(--lili-color-surface-low))]"
            >
              <RiVipCrownFill size={14} />
            </div>
          )}
        </div>
        <div className="flex w-full flex-col items-center space-y-1">
          <span className="max-w-full min-w-0 truncate text-lg">{u.uname}</span>
          <span className="text-foreground-500 line-clamp-2 w-full text-center text-sm">{u.sign}</span>
        </div>
      </CardBody>

      {/* 常驻的更多操作入口：不依赖 hover，键盘 focus 也可达。 */}
      <div className="absolute top-2 right-2 z-20">
        <Dropdown
          placement="bottom-end"
          classNames={{
            content: "min-w-36",
          }}
        >
          <DropdownTrigger>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              radius="md"
              aria-label={`更多操作：${u.uname}`}
              className="bg-default-100/80 text-default-600 data-[hover=true]:bg-default-200/90 opacity-0 backdrop-blur-md transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
              onPress={e => e.continuePropagation()}
            >
              <RiMore2Fill size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label={`更多操作：${u.uname}`} variant="flat">
            <DropdownItem key="set-group" startContent={<RiGroupLine size={18} />} onPress={handleSetGroup}>
              设置分组
            </DropdownItem>
            <DropdownItem
              key="unfollow"
              className="text-danger"
              color="danger"
              startContent={<RiUserUnfollowLine size={18} />}
              onPress={handleUnfollow}
            >
              取消关注
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </Card>
  );
};

export default UserCard;
