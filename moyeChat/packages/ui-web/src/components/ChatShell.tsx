"use client";

import type { ConversationId } from "@agent-chat/chat-core";

import { ChatComposer } from "./Composer";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageTimeline } from "./MessageTimeline";
import { ToolCallPanel } from "./ToolCallPanel";
import type { ChatShellProps } from "../types";

export function ChatShell(props: ChatShellProps) {
  const hasToolCalls = props.messages.some((message) => message.toolCalls.length > 0);
  const activeConversation = props.conversations.find(
    (conversation) => conversation.id === props.activeConversationId
  );

  return (
    <div style={styles.root}>
      <ConversationSidebar
        activeConversationId={props.activeConversationId}
        conversations={props.conversations}
        onCreateConversation={props.onCreateConversation}
        onSelectConversation={(conversationId: ConversationId) => props.onSelectConversation(conversationId)}
      />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>{activeConversation?.title ?? "Agent Chat"}</div>
            <div style={styles.subtitle}>{props.messages.length} messages</div>
          </div>
        </header>

        <section style={styles.content}>
          <MessageTimeline messages={props.messages} />
          {hasToolCalls ? <ToolCallPanel messages={props.messages} /> : null}
        </section>

        <ChatComposer
          isSending={props.isSending}
          onCancel={props.onCancel}
          onInputChange={props.onInputChange}
          onSend={props.onSend}
          value={props.inputValue}
        />
      </main>
    </div>
  );
}

const styles = {
  root: {
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr)",
    height: "100dvh",
    minWidth: 0,
    background: "#f7f8fa"
  },
  main: {
    display: "grid",
    gridTemplateRows: "64px minmax(0, 1fr) auto",
    minWidth: 0
  },
  header: {
    alignItems: "center",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 24px"
  },
  title: {
    color: "#111827",
    fontSize: 15,
    fontWeight: 700
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2
  },
  content: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    minHeight: 0
  }
};
