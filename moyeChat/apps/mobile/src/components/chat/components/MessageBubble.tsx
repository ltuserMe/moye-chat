import type { ChatMessage, ToolCall } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function MessageBubble({ message, showStreaming }: { message: ChatMessage; showStreaming: boolean }): ReactElement {
  const isUser = message.role === "user";
  const showTyping = showStreaming && message.role === "assistant" && message.status === "streaming";

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        ) : null}
        <View style={styles.bubbleContent}>
          {!isUser ? <Text style={styles.senderName}>智能助手</Text> : null}
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            {isUser ? (
              <Text style={styles.userContent}>{message.content}</Text>
            ) : message.content.length > 0 ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <TypingIndicator />
            )}
          </View>
          {message.toolCalls.length > 0 ? <ToolTracePanel toolCalls={message.toolCalls} /> : null}
          {showTyping ? <TypingIndicator /> : null}
          {message.status === "failed" ? <StatusPill tone="danger" text={message.error ?? "生成失败"} /> : null}
          {message.status === "cancelled" ? <StatusPill tone="muted" text="已停止" /> : null}
        </View>
      </View>
    </View>
  );
}

function ToolTracePanel({ toolCalls }: { toolCalls: readonly ToolCall[] }): ReactElement {
  return (
    <View style={styles.trace}>
      <View style={styles.traceHeader}>
        <Text style={styles.traceTitle}>工具调用</Text>
        <Text style={styles.traceMeta}>{toolCalls.length}</Text>
      </View>
      <View style={styles.traceBody}>
        {toolCalls.map((toolCall) => (
          <View key={toolCall.id} style={styles.traceNode}>
            <Text style={styles.nodeIcon}>{getToolStatusIcon(toolCall.status)}</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{toolCall.name}</Text>
              <Text style={styles.nodeDesc}>{toolCall.error ?? toolCall.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TypingIndicator(): ReactElement {
  return (
    <View style={styles.typingIndicator}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  );
}

function StatusPill({ text, tone }: { text: string; tone: "danger" | "muted" }): ReactElement {
  return (
    <View style={[styles.statusPill, tone === "danger" ? styles.statusPillDanger : styles.statusPillMuted]}>
      <Text style={[styles.statusPillText, tone === "danger" ? styles.statusPillTextDanger : styles.statusPillTextMuted]}>
        {text}
      </Text>
    </View>
  );
}

function getToolStatusIcon(status: ToolCall["status"]): string {
  switch (status) {
    case "done":
      return ".";
    case "failed":
      return "!";
    case "running":
      return ">";
    default:
      return "-";
  }
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%"
  },
  messageRowUser: {
    justifyContent: "flex-end"
  },
  messageContainer: {
    flexDirection: "row",
    gap: 10,
    maxWidth: "90%"
  },
  messageContainerUser: {
    flexDirection: "row-reverse"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: tokens.color.accent,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    marginTop: 2,
    width: 28
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700"
  },
  bubbleContent: {
    gap: tokens.spacing.sm,
    minWidth: 0
  },
  senderName: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.small.fontSize
  },
  bubble: {
    maxWidth: "100%"
  },
  userBubble: {
    backgroundColor: tokens.color.userBubble,
    borderBottomRightRadius: 4,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  assistantBubble: {
    backgroundColor: "transparent",
    paddingVertical: 4
  },
  userContent: {
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight
  },
  trace: {
    backgroundColor: "#ffffff",
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden"
  },
  traceHeader: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  traceTitle: {
    color: tokens.color.textSecondary,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: "600"
  },
  traceMeta: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.small.fontSize
  },
  traceBody: {
    borderTopColor: tokens.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 12
  },
  traceNode: {
    flexDirection: "row",
    gap: 8
  },
  nodeIcon: {
    color: tokens.color.traceSuccess,
    fontSize: 11,
    fontWeight: "700"
  },
  nodeContent: {
    flex: 1
  },
  nodeTitle: {
    color: tokens.color.text,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: "700"
  },
  nodeDesc: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.small.fontSize,
    lineHeight: 15,
    marginTop: 2
  },
  typingIndicator: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 8
  },
  typingDot: {
    backgroundColor: tokens.color.textMuted,
    borderRadius: 3,
    height: 5,
    opacity: 0.55,
    width: 5
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  statusPillDanger: {
    backgroundColor: tokens.color.dangerBg
  },
  statusPillMuted: {
    backgroundColor: "#f1f3f4"
  },
  statusPillText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: "600"
  },
  statusPillTextDanger: {
    color: tokens.color.danger
  },
  statusPillTextMuted: {
    color: tokens.color.textSecondary
  }
});
