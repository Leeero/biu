import { useSearchParams } from "react-router";

import { getSocialTab } from "@/features/social/model";
import DynamicFeed from "@/pages/dynamic-feed";
import FollowList from "@/pages/follow-list";
import { useUser } from "@/store/user";
import { PageHeader } from "@/ui/patterns/page-header";
import { PageState } from "@/ui/states/page-state";

const SocialPage = () => {
  const [searchParams] = useSearchParams();
  const user = useUser(state => state.user);
  const selectedTab = getSocialTab(searchParams.get("tab"));

  if (!user?.isLogin) {
    return <PageState kind="empty" title="登录后查看关注内容" description="关注列表与动态同步自当前 B 站账号" />;
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col">
      <PageHeader title="我的关注" lead="查看关注的创作者与他们发布的最新音乐内容；分组和关注关系仍与 B 站账号同步。" />
      <div className="min-h-0 flex-1">{selectedTab === "updates" ? <DynamicFeed /> : <FollowList />}</div>
    </main>
  );
};

export default SocialPage;
