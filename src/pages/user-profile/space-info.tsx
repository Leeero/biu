import { useParams } from "react-router";

import { Avatar, Image, Tooltip } from "@heroui/react";
import { RiAddLine, RiCheckLine, RiFlashlightFill } from "@remixicon/react";

import { UserRelation } from "@/common/constants/relation";
import { formatNumber } from "@/common/utils/number";
import AsyncButton from "@/components/async-button";
import { postRelationModify, UserRelationAction } from "@/service/relation-modify";
import { type RelationStatData } from "@/service/relation-stat";
import { type SpaceAccInfoData } from "@/service/space-wbi-acc-info";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

interface Props {
  spaceInfo?: SpaceAccInfoData;
  relationStats?: RelationStatData;
  relationWithMe?: number;
  refreshRelation: () => Promise<number>;
}

const SpaceInfo = ({ spaceInfo, relationStats, relationWithMe, refreshRelation }: Props) => {
  const user = useUser(s => s.user);
  const themeMode = useSettings(s => s.themeMode);
  const { id } = useParams();
  const isSelf = user?.mid === Number(id);

  const isFollow = [UserRelation.Followed, UserRelation.MutualFollowed].includes(relationWithMe as UserRelation);

  const stats = [
    {
      title: "关注数",
      value: relationStats?.following,
      hidden: !isSelf,
    },
    {
      title: "粉丝数",
      value: formatNumber(relationStats?.follower),
    },
    {
      title: "等级",
      value: `Lv${spaceInfo?.level ?? 0}`,
    },
  ].filter(item => !item.hidden);

  const toggleFollow = async () => {
    let act = 0;

    if (isFollow) {
      act = UserRelationAction.Unfollow;
    } else if (relationWithMe === UserRelation.Unfollowed) {
      act = UserRelationAction.Follow;
    } else if (relationWithMe === UserRelation.Blocked) {
      act = UserRelationAction.Unblock;
    }

    const res = await postRelationModify({
      fid: Number(id),
      act,
    });

    if (res?.code === 0) {
      await refreshRelation();
    }
  };

  const isDarkTheme =
    themeMode === "dark" || (themeMode === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const overlayOpacity = isDarkTheme ? 0.5 : 0.3;

  if (relationWithMe === UserRelation.Blocked) {
    return (
      <div className="flex h-[480px] w-full flex-col items-center justify-center space-y-6">
        <Avatar src={spaceInfo?.face} alt={spaceInfo?.name} className="h-[120px] w-[120px] shadow-lg" />
        <p className="text-lg">已拉黑</p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[248px] overflow-hidden bg-cover bg-center text-white bg-blend-multiply"
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.75}), rgba(0,0,0,${Math.min(overlayOpacity + 0.32, 0.82)})), url(${spaceInfo?.top_photo_v2?.l_200h_img}) center/cover no-repeat`,
      }}
    >
      <div className="mx-auto flex min-h-[248px] w-full max-w-[1440px] items-end justify-between gap-8 px-6 py-7 lg:px-8">
        <div className="flex min-w-0 grow items-end gap-5">
          <Avatar
            src={spaceInfo?.face}
            alt={spaceInfo?.name}
            className="h-[112px] w-[112px] flex-none border-2 border-white/70 shadow-xl"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
            <span className="text-xs font-medium tracking-[0.18em] text-white/65">创作者</span>
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {spaceInfo?.name}
              </h1>
              {Boolean(spaceInfo?.official?.role) && (
                <Tooltip closeDelay={0} content={spaceInfo?.official?.title}>
                  <div className="bg-primary flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ring-2 ring-white/80">
                    <RiFlashlightFill size={12} />
                  </div>
                </Tooltip>
              )}
              {Boolean(spaceInfo?.vip?.status) && (
                <Image
                  height={22}
                  src={spaceInfo?.vip?.label?.img_label_uri_hans_static}
                  alt={spaceInfo?.vip?.label?.text}
                />
              )}
            </div>
            <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {spaceInfo?.sign || "这个创作者还没有填写简介"}
            </p>
          </div>
        </div>
        <div className="flex flex-none flex-col items-end gap-4 pb-1">
          {Boolean(user?.isLogin) && !isSelf && (
            <AsyncButton
              variant={isFollow ? "flat" : "solid"}
              color={isFollow ? "default" : "primary"}
              startContent={isFollow ? <RiCheckLine size={18} /> : <RiAddLine size={18} />}
              onPress={toggleFollow}
              className={isFollow ? "bg-white/15 text-white backdrop-blur-md" : "dark:text-black"}
            >
              {isFollow ? "已关注" : "关注"}
            </AsyncButton>
          )}
          {user?.isLogin && (
            <div className="flex items-center gap-1 rounded-xl bg-black/20 p-1 backdrop-blur-md">
              {stats.map(item => (
                <div key={item.title} className="flex min-w-20 flex-col items-center gap-0 px-3 py-1 text-white">
                  <span className="text-base font-semibold">{item.value ?? "--"}</span>
                  <span className="text-xs text-white/65">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceInfo;
