export type SocialTab = "following" | "updates";

export const getSocialTab = (value: string | null): SocialTab => (value === "updates" ? "updates" : "following");

export const getSocialTabHref = (tab: SocialTab) => `/follow?tab=${tab}`;
