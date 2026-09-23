import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Card, CardBody, Tab, Tabs } from "@heroui/react";
import {
  RiDownloadCloud2Line,
  RiInformationLine,
  RiKeyboardLine,
  RiMusic2Line,
  RiSettings3Line,
  RiToolsLine,
} from "@remixicon/react";
import { useShallow } from "zustand/react/shallow";

import ScrollContainer from "@/components/scroll-container";
import { useAppUpdateStore } from "@/store/app-update";
import { useSettings } from "@/store/settings";

import MenuSettings from "./menu-settings";
import ProxySettings from "./proxy-settings";
import ShortcutSettingsPage from "./shortcut-settings";
import { SystemSettingsTab } from "./system-settings";

const useSystemSettingsForm = () => {
  const [appVersion, setAppVersion] = useState<string>("");
  const {
    fontFamily,
    primaryColor,
    backgroundColor,
    borderRadius,
    downloadPath,
    closeWindowOption,
    autoStart,
    audioQuality,
    hiddenMenuKeys,
    displayMode,
    ffmpegPath,
    themeMode,
    pageTransition,
    showSearchHistory,
    proxySettings,
    reportPlayHistory,
  } = useSettings(
    useShallow(s => ({
      fontFamily: s.fontFamily,
      primaryColor: s.primaryColor,
      backgroundColor: s.backgroundColor,
      borderRadius: s.borderRadius,
      downloadPath: s.downloadPath,
      closeWindowOption: s.closeWindowOption,
      autoStart: s.autoStart,
      audioQuality: s.audioQuality,
      hiddenMenuKeys: s.hiddenMenuKeys,
      displayMode: s.displayMode,
      ffmpegPath: s.ffmpegPath,
      themeMode: s.themeMode,
      pageTransition: s.pageTransition,
      showSearchHistory: s.showSearchHistory,
      proxySettings: s.proxySettings,
      reportPlayHistory: s.reportPlayHistory,
    })),
  );
  const updateSettings = useSettings(s => s.update);
  const { isUpdateAvailable, latestVersion } = useAppUpdateStore(
    useShallow(s => ({
      isUpdateAvailable: s.isUpdateAvailable ?? false,
      latestVersion: s.latestVersion,
    })),
  );

  const { control, watch, setValue } = useForm<AppSettings>({
    defaultValues: {
      fontFamily,
      primaryColor,
      backgroundColor,
      borderRadius,
      downloadPath,
      closeWindowOption,
      autoStart,
      audioQuality,
      hiddenMenuKeys,
      displayMode,
      ffmpegPath,
      themeMode,
      pageTransition,
      showSearchHistory,
      proxySettings: proxySettings ?? {
        type: "none",
        host: "",
        port: undefined,
        username: "",
        password: "",
      },
      reportPlayHistory,
    },
  });

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (!name) return;
      const patch = { [name]: (values as any)[name] } as Partial<AppSettings>;
      updateSettings(patch);
      if (name === "proxySettings" && values.proxySettings && window.electron?.setProxySettings) {
        window.electron.setProxySettings(values.proxySettings as ProxySettings);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateSettings]);

  useEffect(() => {
    window.electron.getAppVersion().then(v => setAppVersion(v));
  }, []);

  return {
    appVersion,
    audioQuality,
    control,
    isUpdateAvailable,
    latestVersion,
    setValue,
  };
};

const SettingsPage = () => {
  const system = useSystemSettingsForm();

  const tabTitle = (icon: React.ReactNode, label: string) => (
    <div className="flex w-36 items-center gap-3 px-2">
      {icon}
      <span>{label}</span>
    </div>
  );

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <div className="mx-auto w-full max-w-[1180px] px-8 py-7">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold">设置</h1>
          <p className="text-default-500 mt-1 text-sm">管理 Biu 的界面、播放与本地应用偏好</p>
        </div>
        <Tabs
          disableAnimation
          aria-label="设置分类"
          placement="start"
          variant="light"
          classNames={{
            base: "items-start",
            tabList: "sticky top-4 w-44 gap-1 bg-transparent p-0",
            tab: "h-11 justify-start px-1",
            cursor: "rounded-lg",
            panel: "min-w-0 flex-1 px-7 py-0",
          }}
        >
          <Tab key="general" title={tabTitle(<RiSettings3Line size={19} />, "常规")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="gap-8 p-6">
                <SystemSettingsTab {...system} section="general" />
                <div className="border-divider border-t pt-6">
                  <MenuSettings control={system.control} />
                </div>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="playback" title={tabTitle(<RiMusic2Line size={19} />, "播放")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="p-6">
                <SystemSettingsTab {...system} section="playback" />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="download" title={tabTitle(<RiDownloadCloud2Line size={19} />, "下载与本地")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="p-6">
                <SystemSettingsTab {...system} section="download" />
                <p className="text-default-500 border-divider mt-6 border-t pt-5 text-sm">
                  本地音乐目录仍在“本地音乐”页面中管理，已有目录配置保持不变。
                </p>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="shortcut" title={tabTitle(<RiKeyboardLine size={19} />, "快捷键")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="p-6">
                <ShortcutSettingsPage />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="advanced" title={tabTitle(<RiToolsLine size={19} />, "高级")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="gap-5 p-6">
                <div>
                  <h2>网络代理</h2>
                  <p className="text-default-500 mt-1 text-sm">为应用访问在线服务配置代理连接</p>
                </div>
                <ProxySettings control={system.control} />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="about" title={tabTitle(<RiInformationLine size={19} />, "关于")}>
            <Card shadow="none" className="border-divider bg-content1/70 border">
              <CardBody className="p-6">
                <SystemSettingsTab {...system} section="about" />
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </ScrollContainer>
  );
};

export default SettingsPage;
