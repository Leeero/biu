import clx from "classnames";

import MenuItem, { type MenuItemProps } from "../../components/menu/menu-item";

interface Props {
  title?: React.ReactNode;
  titleExtra?: React.ReactNode;
  items: MenuItemProps[];
  collapsed?: boolean;
  className?: string;
  renderItem?: (item: MenuItemProps, index: number) => React.ReactNode;
}

const MenuGroup = ({ title, titleExtra, items, collapsed, className, renderItem }: Props) => {
  return (
    <>
      {!collapsed && Boolean(title) && (
        <div className="flex items-center justify-between px-2 pt-5 pb-2 text-xs font-medium tracking-wide text-[rgb(var(--biu-color-text-tertiary))]">
          <span>{title}</span>
          {titleExtra}
        </div>
      )}
      <div
        className={clx(
          "flex flex-col items-stretch gap-1",
          {
            "px-2": collapsed,
          },
          className,
        )}
      >
        {items.map((item, index) =>
          renderItem ? (
            renderItem(item, index)
          ) : (
            <MenuItem key={(item.id ?? item.href ?? item.title) as React.Key} {...item} collapsed={collapsed} />
          ),
        )}
      </div>
    </>
  );
};

export default MenuGroup;
