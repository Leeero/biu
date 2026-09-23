import React from "react";
import { useLocation, useNavigate } from "react-router";

import { Button, Tooltip } from "@heroui/react";
import { RiArrowLeftSLine } from "@remixicon/react";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  // subscribe to location changes to re-render and reflect history state updates
  useLocation();

  const canGoBack = (window.history?.state?.idx ?? 0) > 0;

  return (
    <Tooltip content="返回" closeDelay={0}>
      <Button
        isIconOnly
        aria-label="返回上一页"
        variant="light"
        radius="full"
        isDisabled={!canGoBack}
        onPress={() => navigate(-1)}
        className="h-9 w-9 min-w-9 text-[rgb(var(--biu-color-text-secondary))]"
      >
        <RiArrowLeftSLine size={22} />
      </Button>
    </Tooltip>
  );
};

export default Navigation;
