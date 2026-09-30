import React, { useEffect, useState } from "react";
import { Controller, type Control } from "react-hook-form";

import { Button, Form, Input, Select, SelectItem, addToast } from "@heroui/react";

interface ProxySettingsProps {
  control: Control<AppSettings>;
}

const PROXY_TYPE_OPTIONS: { key: ProxyType; label: string }[] = [
  { key: "none", label: "不使用代理" },
  { key: "http", label: "HTTP 代理" },
  { key: "socks4", label: "SOCKS4 代理" },
  { key: "socks5", label: "SOCKS5 代理" },
];

const EMPTY_PROXY: ProxySettings = {
  type: "none",
  host: "",
  port: undefined,
  username: "",
  password: "",
};

const ProxyEditor = ({ value, onApply }: { value: ProxySettings; onApply: (value: ProxySettings) => void }) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const setProxy = (patch: Partial<ProxySettings>) => setDraft(current => ({ ...current, ...patch }));
  const needsAddress = draft.type !== "none";
  const isValid = !needsAddress || (Boolean(draft.host.trim()) && Boolean(draft.port && draft.port <= 65535));
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);
  const showPassword = draft.type === "http" || draft.type === "socks5";

  const apply = () => {
    if (!isValid) return;
    onApply(draft);
    addToast({ title: "代理设置已应用", color: "success" });
  };

  return (
    <div className="w-full space-y-5">
      <div className="w-[240px] max-sm:w-full">
        <Select
          disallowEmptySelection
          aria-label="代理类型"
          selectedKeys={new Set([draft.type])}
          onSelectionChange={keys => {
            const next = Array.from(keys)[0] as ProxyType | undefined;
            setProxy({ type: next ?? "none" });
          }}
        >
          {PROXY_TYPE_OPTIONS.map(option => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>
      </div>

      {needsAddress && (
        <>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Input
              label="主机"
              placeholder="例如 127.0.0.1"
              value={draft.host ?? ""}
              isInvalid={!draft.host.trim()}
              errorMessage="请输入代理主机"
              onValueChange={host => setProxy({ host })}
            />
            <Input
              label="端口"
              placeholder="1–65535"
              inputMode="numeric"
              value={draft.port ? String(draft.port) : ""}
              isInvalid={!draft.port || draft.port > 65535}
              errorMessage="请输入有效端口"
              onValueChange={nextValue => {
                const port = Number(nextValue.trim());
                setProxy({ port: Number.isInteger(port) && port > 0 ? port : undefined });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Input
              label="用户名（可选）"
              value={draft.username ?? ""}
              onValueChange={username => setProxy({ username })}
            />
            {showPassword && (
              <Input
                label="密码（可选）"
                type="password"
                value={draft.password ?? ""}
                onValueChange={password => setProxy({ password })}
              />
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="light" isDisabled={!isDirty} onPress={() => setDraft(value)}>
          撤销修改
        </Button>
        <Button color="primary" isDisabled={!isDirty || !isValid} onPress={apply}>
          应用代理设置
        </Button>
      </div>
    </div>
  );
};

const ProxySettings: React.FC<ProxySettingsProps> = ({ control }) => {
  return (
    <Form className="space-y-6">
      <Controller
        control={control}
        name="proxySettings"
        render={({ field }) => <ProxyEditor value={field.value ?? EMPTY_PROXY} onApply={field.onChange} />}
      />
    </Form>
  );
};

export default ProxySettings;
