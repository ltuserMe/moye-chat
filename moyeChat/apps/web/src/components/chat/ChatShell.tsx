"use client";

import type { ConversationId } from "@agent-chat/chat-core";
import { type ThemeMode } from "@agent-chat/utils";
import { ActionIcon, Tag } from "@lobehub/ui";
import { Drawer, Select } from "antd";
import { Settings, Moon, Sun, Monitor } from "lucide-react";
import { useMemo, useState } from "react";

import { useThemeMode } from "@/hooks/useThemeMode";
import { ChatComposer } from "./Composer";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageTimeline } from "./MessageTimeline";
import type { ChatShellProps } from "./types";

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];
const ThemeIcon = {
  light: Sun,
  dark: Moon,
  system: Monitor
} as const;
const ThemeTitle = {
  light: "浅色模式",
  dark: "深色模式",
  system: "跟随系统"
} as const;

export function ChatShell(props: ChatShellProps) {
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const NextIcon = ThemeIcon[themeMode];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeConversation = props.conversations.find(
    (conversation) => conversation.id === props.activeConversationId
  );
  const selectedModel = props.models?.find((model) => model.id === props.selectedModelId) ?? props.models?.[0];
  const tokenCount = useMemo(
    () => estimateTokens([props.inputValue, ...props.messages.map((message) => message.content)].join("\n")),
    [props.inputValue, props.messages]
  );

  return (
    <div className="moye-chat-shell" style={styles.root}>
      <ConversationSidebar
        activeConversationId={props.activeConversationId}
        conversations={props.conversations}
        onCreateConversation={props.onCreateConversation}
        onDeleteConversation={props.onDeleteConversation}
        onRenameConversation={props.onRenameConversation}
        onSelectConversation={(conversationId: ConversationId) => props.onSelectConversation(conversationId)}
      />

      <main className="moye-chat-main" style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>{activeConversation?.title ?? "未选择对话"}</div>
            <div style={styles.subtitle}>{props.messages.length} 条消息 · 上下文已同步</div>
          </div>
          <div style={styles.headerRight}>
            <Tag color={props.isSending ? "blue" : "green"}>{props.isSending ? "生成中" : "就绪"}</Tag>
            <ActionIcon
              icon={NextIcon}
              onClick={() => {
                const idx = THEME_CYCLE.indexOf(themeMode);
                setThemeMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
              }}
              title={ThemeTitle[themeMode]}
            />
            <ActionIcon
              icon={Settings}
              onClick={() => setSettingsOpen(true)}
              title="设置"
            />
          </div>
        </header>

        <section className="moye-chat-content" style={styles.content}>
          <MessageTimeline
            messages={props.messages}
            onDeleteMessage={props.onDeleteMessage}
            onEditMessage={props.onEditMessage}
            onExamplePrompt={props.onExamplePrompt}
            onRetryMessage={props.onRetryMessage}
          />
        </section>

        <ChatComposer
          attachments={props.inputAttachments ?? []}
          isSending={props.isSending}
          models={props.models}
          onAttachmentsChange={props.onAttachmentsChange}
          onCancel={props.onCancel}
          onInputChange={props.onInputChange}
          onModelChange={props.onModelChange}
          onSend={props.onSend}
          selectedModelId={props.selectedModelId}
          tokenCount={tokenCount}
          value={props.inputValue}
        />
      </main>
      <Drawer
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        placement="right"
        size={360}
        title="应用设置"
      >
        <div style={styles.settingsGroup}>
          <div style={styles.settingsLabel}>当前模型</div>
          <Select
            onChange={props.onModelChange}
            options={(props.models ?? []).map((model) => ({
              label: `${model.name}${model.description === undefined ? "" : ` · ${model.description}`}`,
              value: model.id
            }))}
            style={styles.settingsSelect}
            value={selectedModel?.id}
          />
        </div>
        <div style={styles.settingsGroup}>
          <div style={styles.settingsLabel}>会话状态</div>
          <div style={styles.settingsMeta}>
            {props.conversations.length} 个对话 · {props.messages.length} 条当前消息 · 约 {tokenCount} tokens
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function estimateTokens(content: string): number {
  const chineseCharacters = content.match(/[一-鿿]/g)?.length ?? 0;
  const words = content.replace(/[一-鿿]/g, " ").match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  return Math.ceil(chineseCharacters + words * 1.35);
}

const styles = {
  root: {
    display: "grid",
    gridTemplateColumns: "300px minmax(0, 1fr)",
    height: "100dvh",
    minWidth: 0,
    overflow: "hidden",
    background: "var(--bg-sidebar)" // 全局纯净白底
  },
  main: {
    display: "grid",
    gridTemplateRows: "72px minmax(0, 1fr) auto",
    minHeight: 0,
    minWidth: 0
  },
  header: {
    alignItems: "center",
    background: "var(--bg-header)",
    backdropFilter: "blur(16px)", // 增加毛玻璃效果
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid var(--border-medium)",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 28px",
    zIndex: 10
  },
  title: {
    color: "var(--text-primary)",
    fontSize: 17,
    fontWeight: 760
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: 12,
    marginTop: 2
  },
  headerRight: {
    alignItems: "center",
    display: "flex",
    gap: 16
  },
  settingsGroup: {
    display: "grid",
    gap: 8,
    marginBottom: 22
  },
  settingsLabel: {
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 650
  },
  settingsMeta: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-medium)",
    borderRadius: 10,
    color: "var(--text-muted)",
    fontSize: 13,
    lineHeight: 1.6,
    padding: 12
  },
  settingsSelect: {
    width: "100%"
  },
  content: {
    display: "block",
    minHeight: 0,
    overflow: "hidden"
  }
};
