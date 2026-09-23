export const normalizeSearchKeyword = (value: string) => value.trim();

export const shouldSubmitSearch = (value: string) => normalizeSearchKeyword(value).length > 0;
