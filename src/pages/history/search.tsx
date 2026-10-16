import { useState } from "react";

import { Input } from "@heroui/react";
import { RiSearchLine } from "@remixicon/react";
import { useDebounceFn } from "ahooks";

import DateRangePicker from "@/components/date-range-picker";

interface Props {
  onSearch?: (keyword: string) => void;
  onDateRangeChange?: (range: { start?: number; end?: number } | null) => void;
}

const HistorySearch = ({ onSearch, onDateRangeChange }: Props) => {
  const [keyword, setKeyword] = useState("");

  const { run: handleSearch } = useDebounceFn(
    (val: string) => {
      onSearch?.(val);
    },
    { wait: 500 },
  );

  // 输入即搜（500ms 防抖），清除也走同一入口，不再等回车。
  const handleChange = (val: string) => {
    setKeyword(val);
    handleSearch(val);
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 py-2">
      <DateRangePicker onDateRangeChange={onDateRangeChange} />
      <Input
        placeholder="搜索标题/UP主名称"
        startContent={<RiSearchLine size={16} />}
        value={keyword}
        onValueChange={handleChange}
        isClearable
        onClear={() => handleChange("")}
        radius="md"
        className="max-w-50 flex-auto"
      />
    </div>
  );
};

export default HistorySearch;
