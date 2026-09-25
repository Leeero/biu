import { useNavigate } from "react-router";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
  useDisclosure,
  type DropdownItemProps,
} from "@heroui/react";
import {
  RiExternalLinkLine,
  RiFeedbackLine,
  RiHistoryLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiProfileLine,
  RiRefreshLine,
  RiSettings3Line,
  RiTeamLine,
} from "@remixicon/react";
import { twMerge } from "tailwind-merge";

import { DefaultMenuList } from "@/common/constants/menus";
import { postPassportLoginExit } from "@/service/passport-login-exit";
import { useFavoritesStore } from "@/store/favorite";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { usePlayProgress } from "@/store/play-progress";
import { useSettings } from "@/store/settings";
import { useToken } from "@/store/token";
import { useUser } from "@/store/user";

import Login from "./login";

interface AvatarMenuProps {
  onDropdownOpenChange?: (open: boolean) => void;
}

/**
 * 顶栏头像菜单。
 *
 * 决策 3 移除侧栏后，这里成了「一级导航」的主要出口——二级与以下入口全部挂在
 * 头像上，因此菜单第一组就是 `DefaultMenuList`（发现音乐 / 我的音乐库 / 稍后播放 /
 * 本地音乐 / 下载管理），并沿用既有的两条过滤规则：未登录时隐藏 `needLogin` 项，
 * 以及设置页里被隐藏的 `hiddenMenuKeys`。
 *
 * 视觉上只改了触发件：按设计稿把头像固定为 40 × 40 正圆，其余交互
 * （登录弹窗、退出确认、刷新数据）沿用上一轮实现，不做行为改动。
 */
const AvatarMenu = ({ onDropdownOpenChange }: AvatarMenuProps) => {
  const user = useUser(s => s.user);
  const clearUser = useUser(s => s.clear);
  const clearToken = useToken(s => s.clear);
  const navigate = useNavigate();
  const updateSettings = useSettings(s => s.update);
  const hiddenMenuKeys = useSettings(s => s.hiddenMenuKeys);

  const { isOpen: isLoginModalOpen, onOpen: openLoginModal, onOpenChange: onLoginModalOpenChange } = useDisclosure();
  const onOpenConfirmModal = useModalStore(s => s.onOpenConfirmModal);

  const logout = async () => {
    const csrfToken = await window.electron.getCookie("bili_jct");
    if (!csrfToken) {
      addToast({
        title: "CSRF Token 不存在",
        color: "danger",
      });
      return false;
    }

    const res = await postPassportLoginExit({
      biliCSRF: csrfToken,
    });
    if (res?.code === 0) {
      clearToken();
      clearUser();
      updateSettings({
        hiddenMenuKeys: [],
      });
      usePlayList.getState().clear();
      useFavoritesStore.setState({
        createdFavorites: [],
        collectedFavorites: [],
      });
      usePlayProgress.setState({
        currentTime: 0,
      });
      navigate("/");
      return true;
    } else {
      addToast({
        title: res?.message || "退出登录失败",
        color: "danger",
      });
      return false;
    }
  };

  const navItems: (DropdownItemProps & { label: string })[] = DefaultMenuList.filter(item =>
    item.needLogin ? user?.isLogin : true,
  )
    .filter(item => (item.href ? !hiddenMenuKeys.includes(item.href) : true))
    .map(item => ({
      key: `nav:${item.href}`,
      label: item.title,
      startContent: item.icon ? <item.icon size={18} /> : undefined,
      onPress: () => navigate(item.href!),
    }));

  const accountItems: (DropdownItemProps & { label: string; hidden?: boolean })[] = [
    {
      key: "login",
      label: "登录",
      startContent: <RiLoginCircleLine size={18} />,
      hidden: user?.isLogin,
      onPress: openLoginModal,
    },
    {
      key: "profile",
      label: "个人资料",
      startContent: <RiProfileLine size={18} />,
      hidden: !user?.isLogin,
      onPress: () => navigate(`/user/${user?.mid}`),
    },
    {
      key: "following",
      label: "关注与动态",
      startContent: <RiTeamLine size={18} />,
      hidden: !user?.isLogin,
      onPress: () => navigate("/follow"),
    },
    {
      key: "history",
      label: "B站历史",
      startContent: <RiHistoryLine size={18} />,
      hidden: !user?.isLogin,
      onPress: () => navigate("/history"),
    },
  ];

  const appItems: (DropdownItemProps & { label: string })[] = [
    {
      key: "settings",
      label: "设置",
      startContent: <RiSettings3Line size={18} />,
      onPress: () => navigate("/settings"),
    },
    {
      key: "refresh",
      label: "刷新数据",
      startContent: <RiRefreshLine size={18} />,
      onPress: async () => {
        try {
          await useUser.getState().updateUser();
          const mid = useUser.getState().user?.mid;
          if (mid) {
            await useFavoritesStore.getState().updateCreatedFavorites(mid);
            await useFavoritesStore.getState().updateCollectedFavorites(mid);
          }
          addToast({
            title: "数据刷新成功",
            color: "success",
          });
        } catch {
          addToast({
            title: "刷新数据失败",
            color: "danger",
          });
        }
      },
    },
    {
      key: "feedback",
      label: "问题反馈",
      startContent: <RiFeedbackLine size={18} />,
      endContent: <RiExternalLinkLine size={18} />,
      onPress: () => window.electron.openExternal("https://github.com/Leeero/biu/issues"),
    },
    {
      key: "logout",
      label: "退出登录",
      startContent: <RiLogoutCircleLine size={18} />,
      color: "danger" as const,
      className: "text-danger",
      hidden: !user?.isLogin,
      onPress: () => {
        onOpenConfirmModal({
          title: "确认退出登录？",
          type: "danger",
          onConfirm: async () => {
            await logout();
            return true;
          },
        });
      },
    },
  ].filter(item => !(item as { hidden?: boolean }).hidden);

  return (
    <>
      <Dropdown
        shouldBlockScroll={false}
        triggerScaleOnOpen={false}
        radius="md"
        classNames={{
          content: "min-w-[180px]",
        }}
        onOpenChange={onDropdownOpenChange}
      >
        <DropdownTrigger>
          <Avatar
            isBordered
            showFallback
            as="button"
            type="button"
            aria-label="账户与导航菜单"
            className="h-10 w-10 flex-none cursor-pointer transition-transform hover:scale-105"
            src={user?.face}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="账户与导航" variant="flat" items={[...navItems, ...accountItems, ...appItems]}>
          {({ key, label, className, ...rest }) => (
            <DropdownItem className={twMerge("rounded-medium", className)} key={key} {...rest}>
              {label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
      <Login isOpen={isLoginModalOpen} onOpenChange={onLoginModalOpenChange} />
    </>
  );
};

export default AvatarMenu;
