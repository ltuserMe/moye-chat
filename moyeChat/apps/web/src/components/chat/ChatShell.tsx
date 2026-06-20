"use client";

import type { ConversationId } from "@agent-chat/chat-core";
import { ActionIcon, Tag } from "@lobehub/ui";
import { Drawer, Select } from "antd";
import { Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { ChatComposer } from "./Composer";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageTimeline } from "./MessageTimeline";
import type { ChatShellProps } from "./types";

export function ChatShell(props: ChatShellProps) {
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
    background: "#ffffff" // 全局纯净白底
  },
  main: {
    display: "grid",
    gridTemplateRows: "72px minmax(0, 1fr) auto",
    minHeight: 0,
    minWidth: 0
  },
  header: {
    alignItems: "center",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(16px)", // 增加毛玻璃效果
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 28px",
    zIndex: 10
  },
  title: {
    color: "#111827",
    fontSize: 17,
    fontWeight: 760
  },
  subtitle: {
    color: "#6b7280",
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
    color: "#111827",
    fontSize: 13,
    fontWeight: 650
  },
  settingsMeta: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    color: "#475569",
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
