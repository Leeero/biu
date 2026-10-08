import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useInterval } from "ahooks";

import { PageState } from "@/ui/states/page-state";

/** 自动返回首页的倒计时秒数。 */
const REDIRECT_SECONDS = 5;

/**
 * 路由不匹配处理。
 *
 * 它挂在壳层内（`routes.tsx` 里是 Layout 的子路由），因此侧栏与播放栏都还在 ——
 * 用户可以直接从侧栏走掉，而不是被钉在一张没有出口的裸页面上。
 * 自动跳转保留，但**把倒计时显示出来**：静默改地址会让人以为自己点错了。
 */
const NotFound = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(REDIRECT_SECONDS);

  useInterval(() => setCount(prev => prev - 1), 1000);

  useEffect(() => {
    if (count <= 0) navigate("/", { replace: true });
  }, [count, navigate]);

  return (
    <PageState
      kind="empty"
      title="页面不存在"
      description="这个地址没有对应的页面，稍后会自动返回首页"
      actionLabel={count > 0 ? `返回首页（${count}s）` : "返回首页"}
      onAction={() => navigate("/", { replace: true })}
    />
  );
};

export default NotFound;
