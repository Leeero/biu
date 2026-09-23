import { memo } from "react";

import { Link, Skeleton, User } from "@heroui/react";
import { RiEdit2Line } from "@remixicon/react";
import { useRequest } from "ahooks";
import clx from "classnames";

import { CollectionType } from "@/common/constants/collection";
import { isPrivateFav } from "@/common/utils/fav";
import Image from "@/components/image";
import { getWebInterfaceCard } from "@/service/user-account";

interface Props {
  loading?: boolean;
  type: CollectionType;
  attr?: number;
  cover?: string;
  title?: string;
  desc?: string;
  upMid?: number;
  mediaCount?: number;
  onEdit?: () => void;
}

const Header = memo(({ loading, type, attr, cover, title, desc, upMid, mediaCount, onEdit }: Props) => {
  const { data: upInfo } = useRequest(
    async () => {
      const res = await getWebInterfaceCard({
        mid: upMid as number,
      });

      return res?.data;
    },
    {
      ready: Boolean(upMid),
      refreshDeps: [upMid],
    },
  );

  if (loading) {
    return (
      <div className="mb-6 flex space-x-5">
        <Skeleton className="h-44 w-44 rounded-[var(--biu-radius-lg)]" />
        <div className="flex min-w-0 flex-col items-start space-y-4">
          <Skeleton className="h-[24px] w-[200px] rounded-md" />
          <Skeleton className="h-[16px] w-[200px] rounded-md" />
          <Skeleton className="h-[16px] w-[200px] rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex items-end gap-6">
        <div className="group relative flex-none">
          <Image
            radius="md"
            src={cover}
            alt={title}
            width={176}
            height={176}
            params="400w_400h_1c.avif"
            className={clx(
              {
                "border-content3 border": !cover,
              },
              "h-44 w-44 object-cover shadow-[var(--biu-shadow-card)]",
            )}
          />
          {typeof onEdit === "function" && (
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={onEdit}
              onKeyDown={e => e.key === "Enter" && onEdit()}
              role="button"
              tabIndex={0}
              aria-label="修改封面"
            >
              <div className="flex flex-col items-center gap-2">
                <RiEdit2Line size={28} />
                <span className="text-sm">修改</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start pb-1">
          <span className="mb-2 text-xs font-medium tracking-wide text-[rgb(var(--biu-color-text-tertiary))]">
            播放列表
          </span>
          <h1 className="line-clamp-2 text-3xl font-bold tracking-[-0.03em]">{title}</h1>
          {Boolean(desc) && (
            <p className="mt-3 line-clamp-2 max-w-3xl text-sm text-[rgb(var(--biu-color-text-secondary))]">{desc}</p>
          )}
          <div className="mt-3 flex items-center space-x-1 text-sm text-[rgb(var(--biu-color-text-tertiary))]">
            <span>
              {type === CollectionType.Favorite
                ? `${attr ? (isPrivateFav(attr as number) ? "私密" : "公开") : ""}收藏夹`
                : type === CollectionType.VideoSeries
                  ? "系列"
                  : "合集"}
            </span>
            <span>•</span>
            <span>{mediaCount ?? 0} 首内容</span>
          </div>
          <User
            avatarProps={{
              size: "sm",
              src: upInfo?.card?.face,
            }}
            name={
              <Link color="foreground" href={`/user/${upMid}`} className="hover:underline">
                {upInfo?.card?.name}
              </Link>
            }
            className="mt-3 justify-start"
          />
        </div>
      </header>
    </>
  );
});

export default Header;
