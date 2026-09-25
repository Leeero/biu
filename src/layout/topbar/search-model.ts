/**
 * 搜索框的纯逻辑。
 *
 * 与组件分开是有意的：这两个函数是「什么时候算一次有效提交」这个判断的唯一出处，
 * 单测直接覆盖它们，组件里就不需要再复制一遍规则。
 */

export const normalizeSearchKeyword = (value: string) => value.trim();

export const shouldSubmitSearch = (value: string) => normalizeSearchKeyword(value).length > 0;

/** 顶栏搜索的快捷键。同时接受 Ctrl 与 ⌘——展示文案按设计稿写「Ctrl K」。 */
export const isSearchShortcut = (event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey">) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

/** 快捷键触发时应忽略的上下文：已经在输入类元素里时不再抢焦点。 */
export const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable;
};
