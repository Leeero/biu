import { useCallback, useMemo } from "react";

import { addToast, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { RiExternalLinkLine, RiMore2Fill, RiThumbUpFill, RiThumbUpLine } from "@remixicon/react";

import { openBiliVideoLink } from "@/common/utils/url";
import IconButton from "@/components/icon-button";
import { postWebInterfaceArchiveLike } from "@/service/web-interface-archive-like";
import { postWebInterfaceArchiveLikeTriple } from "@/service/web-interface-archive-like-triple";
import { useMusicFavStore } from "@/store/music-fav";
import { usePlayList } from "@/store/play-list";
import { useUser } from "@/store/user";

const MusicMoreMenu = () => {
  const user = useUser(s => s.user);
  const list = usePlayList(s => s.list);
  const playId = usePlayList(s => s.playId);
  const playItem = useMemo(() => list.find(item => item.id === playId), [list, playId]);
  const isThumb = useMusicFavStore(s => s.isThumb);
  const setIsThumb = useMusicFavStore(s => s.setIsThumb);
  const setIsFav = useMusicFavStore(s => s.setIsFav);

  const handleToggleThumb = useCallback(async () => {
    if (!playItem?.bvid) return;
    const nextValue = !isThumb;
    setIsThumb(nextValue);
    try {
      const res = await postWebInterfaceArchiveLike({ bvid: playItem.bvid, like: nextValue ? 1 : 2 });
      if (res.code === 0) return;
      setIsThumb(!nextValue);
      addToast({ title: "点赞失败，请稍后重试", color: "danger" });
    } catch {
      setIsThumb(!nextValue);
      addToast({ title: "点赞失败，请稍后重试", color: "danger" });
    }
  }, [isThumb, playItem?.bvid, setIsThumb]);

  const handleTriple = useCallback(async () => {
    if (!playItem?.aid) return;
    try {
      const res = await postWebInterfaceArchiveLikeTriple({ aid: Number(playItem.aid) });
      if (res.code === 0) {
        setIsThumb(res.data.like);
        setIsFav(res.data.fav);
        addToast({ title: "三连成功", color: "success" });
        return;
      }
      addToast({ title: "一键三连失败，请稍后重试", color: "danger" });
    } catch {
      addToast({ title: "一键三连失败，请稍后重试", color: "danger" });
    }
  }, [playItem?.aid, setIsFav, setIsThumb]);

  if (!playItem || playItem.source === "local") return null;

  return (
    <Dropdown placement="top-end">
      <DropdownTrigger>
        <IconButton aria-label="更多操作" radius="full">
          <RiMore2Fill size={18} />
        </IconButton>
      </DropdownTrigger>
      <DropdownMenu aria-label="当前播放内容更多操作">
        <DropdownItem
          key="like"
          className={user?.isLogin ? undefined : "hidden"}
          startContent={isThumb ? <RiThumbUpFill size={18} className="text-primary" /> : <RiThumbUpLine size={18} />}
          onPress={handleToggleThumb}
        >
          {isThumb ? "取消点赞" : "点赞"}
        </DropdownItem>
        <DropdownItem
          key="triple"
          className={user?.isLogin && playItem.aid ? undefined : "hidden"}
          startContent={<RiThumbUpFill size={18} />}
          onPress={handleTriple}
        >
          一键三连
        </DropdownItem>
        <DropdownItem
          key="open-source"
          startContent={<RiExternalLinkLine size={18} />}
          onPress={() => openBiliVideoLink(playItem)}
        >
          在 B 站打开
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default MusicMoreMenu;
