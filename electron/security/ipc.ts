import type { IpcMainEvent, IpcMainInvokeEvent } from "electron";

import { ipcMain } from "electron";

import { isTrustedAppNavigation } from "./validation";

let trustedIndexPath: string | null = null;

export const configureTrustedIpc = (indexPath: string) => {
  trustedIndexPath = indexPath;
};

const isTrustedIpcSender = (event: IpcMainEvent | IpcMainInvokeEvent) => {
  const senderUrl = event.senderFrame?.url || event.sender.getURL();
  return Boolean(trustedIndexPath && isTrustedAppNavigation(senderUrl, trustedIndexPath));
};

const assertTrustedIpcSender = (event: IpcMainEvent | IpcMainInvokeEvent) => {
  if (!isTrustedIpcSender(event)) throw new Error("拒绝来自非应用页面的 IPC 调用");
};

export const handleTrustedIpc = (ipcChannel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => any) => {
  ipcMain.handle(ipcChannel, (event, ...args) => {
    assertTrustedIpcSender(event);
    return listener(event, ...args);
  });
};

export const onTrustedIpc = (ipcChannel: string, listener: (event: IpcMainEvent, ...args: any[]) => void) => {
  ipcMain.on(ipcChannel, (event, ...args) => {
    if (!isTrustedIpcSender(event)) return;
    listener(event, ...args);
  });
};
