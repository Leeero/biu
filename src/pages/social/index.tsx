import { useSearchParams } from "react-router";

import { getSocialTab } from "@/features/social/model";
import DynamicFeed from "@/pages/dynamic-feed";
import FollowList from "@/pages/follow-list";
import { useUser } from "@/store/user";
import { PageState } from "@/ui/states/page-state";

const SocialPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useUser(state => state.user);
  const selectedTab = getSocialTab(searchParams.get("tab"));

  if (!user?.isLogin) {
    return <PageState kind="empty" title="登录后查看关注内容" description="关注列表与动态同步自当前 B 站账号" />;
  }

  return (
    <main className="social4188-page social4188-page--fixed">
      <header className="social4188-head social4188-head--tabs">
        <div>
          <span>内容来源</span>
          <h1>关注的创作者</h1>
          <p>关注与动态保留在音乐主流程之外，用于发现新内容。</p>
        </div>
        <div className="social4188-tabs" role="tablist" aria-label="关注内容类型">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "following"}
            className={selectedTab === "following" ? "is-active" : undefined}
            onClick={() => setSearchParams({ tab: "following" })}
          >
            关注的创作者
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "updates"}
            className={selectedTab === "updates" ? "is-active" : undefined}
            onClick={() => setSearchParams({ tab: "updates" })}
          >
            最新动态
          </button>
        </div>
      </header>
      <div className="social4188-body">{selectedTab === "updates" ? <DynamicFeed /> : <FollowList />}</div>
    </main>
  );
};

export default SocialPage;
