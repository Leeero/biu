import React, { useRef } from "react";
import { useParams, useSearchParams } from "react-router";

import { Spinner } from "@heroui/react";
import { useRequest } from "ahooks";

import { UserRelation } from "@/common/constants/relation";
import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { getRelationStat } from "@/service/relation-stat";
import { getXSpaceSettings } from "@/service/space-setting";
import { getSpaceWbiAccInfo } from "@/service/space-wbi-acc-info";
import { getSpaceWbiAccRelation } from "@/service/space-wbi-acc-relation";
import { useUser } from "@/store/user";

import DynamicList from "./dynamic-list";
import Favorites from "./favorites";
import VideoPost from "./post";
import VideoSeries from "./series";
import SpaceInfo from "./space-info";

/**
 * 用户个人中心
 */
const UserProfile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const user = useUser(s => s.user);
  const isSelf = String(user?.mid) === id;
  const scrollRef = useRef<ScrollRefObject>(null);

  const { data: userInfo, loading } = useRequest(
    async () => {
      const res = await getSpaceWbiAccInfo({
        mid: id as string,
      });

      if (res.code === 0) {
        return res.data;
      }
    },
    {
      ready: !!id,
      refreshDeps: [user?.isLogin, id],
    },
  );

  const { data: relationWithMe, refreshAsync: refreshRelation } = useRequest(
    async () => {
      const res = await getSpaceWbiAccRelation({
        mid: Number(id),
      });

      return res.data?.relation?.attribute;
    },
    {
      ready: Boolean(user?.isLogin) && !!id,
      refreshDeps: [id],
    },
  );

  const { data: relationStats } = useRequest(
    async () => {
      const res = await getRelationStat({
        vmid: Number(id),
      });

      return res.data;
    },
    {
      ready: Boolean(id) && relationWithMe !== UserRelation.Blocked,
      refreshDeps: [id],
    },
  );

  const { data: spacePrivacy } = useRequest(
    async () => {
      const res = await getXSpaceSettings({
        mid: Number(id),
        web_location: "333.1387",
      });

      return res.data?.privacy;
    },
    {
      ready: !!id,
      refreshDeps: [id],
    },
  );

  const tabs = [
    {
      label: "音乐内容",
      key: "video",
      content: <VideoPost getScrollElement={() => scrollRef.current?.osInstance()?.elements().viewport || null} />,
    },
    {
      label: "播放列表",
      key: "union",
      content: <VideoSeries getScrollElement={() => scrollRef.current?.osInstance()?.elements().viewport || null} />,
    },
    {
      label: "收藏",
      key: "collection",
      hidden: !isSelf && !spacePrivacy?.fav_video,
      content: <Favorites getScrollElement={() => scrollRef.current?.osInstance()?.elements().viewport || null} />,
    },
    {
      label: "动态",
      key: "dynamic",
      content: (
        <DynamicList
          mid={Number(id)}
          getScrollElement={() => scrollRef.current?.osInstance()?.elements().viewport || null}
        />
      ),
    },
  ].filter(item => !item.hidden);
  const requestedTab = searchParams.get("tab") ?? "video";
  const activeTab = tabs.find(item => item.key === requestedTab) ?? tabs[0];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <ScrollContainer enableBackToTop ref={scrollRef} className="h-full w-full">
      <SpaceInfo
        spaceInfo={userInfo}
        relationStats={relationStats}
        relationWithMe={relationWithMe}
        refreshRelation={refreshRelation}
      />
      {relationWithMe !== UserRelation.Blocked && (
        <div className="mx-auto w-full max-w-[1440px] px-6 py-5 lg:px-8">{activeTab?.content}</div>
      )}
    </ScrollContainer>
  );
};

export default UserProfile;
