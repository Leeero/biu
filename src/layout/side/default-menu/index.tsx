import React, { useMemo } from "react";

import { RiApps2AddFill, RiApps2AddLine } from "@remixicon/react";

import { DefaultMenuList, DiscoveryMenuHrefs, LibraryMenuHrefs } from "@/common/constants/menus";
import MenuGroup from "@/components/menu/menu-group";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";

interface Props {
  isCollapsed?: boolean;
  onOpenAddFavorite?: () => void;
}

const DefaultMenus = ({ isCollapsed, onOpenAddFavorite }: Props) => {
  const user = useUser(state => state.user);
  const hiddenMenuKeys = useSettings(state => state.hiddenMenuKeys);

  const groups = useMemo(() => {
    const filtered = DefaultMenuList.filter(item => (item.needLogin ? user?.isLogin : true)).filter(
      item => item.href && !hiddenMenuKeys.includes(item.href),
    );

    if (isCollapsed) {
      return [{ items: filtered }];
    }

    const select = (hrefs: string[]) => filtered.filter(item => item.href && hrefs.includes(item.href));

    return [{ items: select(DiscoveryMenuHrefs) }, { title: "我的音乐", items: select(LibraryMenuHrefs) }].filter(
      group => group.items.length > 0,
    );
  }, [user?.isLogin, hiddenMenuKeys, isCollapsed]);

  return (
    <>
      {groups.map((group, index) => (
        <MenuGroup key={group.title ?? index} title={group.title} items={group.items} collapsed={isCollapsed} />
      ))}
      {isCollapsed && (
        <MenuGroup
          collapsed
          items={[
            {
              title: "创建收藏夹",
              icon: RiApps2AddLine,
              activeIcon: RiApps2AddFill,
              onPress: onOpenAddFavorite,
            },
          ]}
        />
      )}
    </>
  );
};

export default DefaultMenus;
