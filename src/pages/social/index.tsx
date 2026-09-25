import { useSearchParams } from "react-router";

import { Tab, Tabs } from "@heroui/react";

import { getSocialTab } from "@/features/social/model";
import DynamicFeed from "@/pages/dynamic-feed";
import FollowList from "@/pages/follow-list";
import { useUser } from "@/store/user";
import { PageHeader } from "@/ui/patterns/page-header";
import { PageState } from "@/ui/states/page-state";

const SocialPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useUser(state => state.user);
  const selectedTab = getSocialTab(searchParams.get("tab"));

  if (!user?.isLogin) {
    return <PageState kind="empty" title="登录后查看关注内容" description="关注列表与动态同步自当前 B 站账号" />;
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col">
      <div className="pt-5">
        <PageHeader title="关注" description="查看关注的创作者和他们发布的最新音乐内容" className="mb-2" />
        <Tabs
          aria-label="关注栏目"
          selectedKey={selectedTab}
          onSelectionChange={key => {
            const tab = getSocialTab(String(key));
            setSearchParams(tab === "following" ? {} : { tab });
          }}
          variant="underlined"
          classNames={{ tabList: "gap-6", cursor: "bg-primary", panel: "hidden" }}
        >
          <Tab key="following" title="关注的创作者" />
          <Tab key="updates" title="最新动态" />
        </Tabs>
      </div>
      <div className="min-h-0 flex-1">{selectedTab === "updates" ? <DynamicFeed /> : <FollowList />}</div>
    </main>
  );
};

export default SocialPage;
