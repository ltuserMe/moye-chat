import type { ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  MessagePrimitive,
  ActionBarPrimitive
} from "@assistant-ui/react-native";
import { Copy, RefreshCw } from "lucide-react-native";
import { isImage, getFileIconSvg } from "@agent-chat/utils";

import { assistantTheme as t } from "@/theme/assistant-theme";
import { mobileTokens as tokens } from "@/components/chat/theme/tokens";
import { MarkdownRenderer } from "@/components/chat/components/MarkdownRenderer";
import { AssistantToolCard } from "./AssistantToolCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Part = Record<string, any>;

interface AssistantMessageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: Record<string, any>;
  showStreaming: boolean;
}

/**
 * assistant-ui MessagePrimitive 包装
 * 包含: 气泡布局, Markdown, 工具卡片, 操作栏 (复制/重试)
 */
export function AssistantMessage({
  message,
  showStreaming
}: AssistantMessageProps): ReactElement {
  const isUser = message.role === "user";
  const isStreaming =
    showStreaming && !isUser && (message as Part).status === "streaming";

  const userText = isUser
    ? (((message as Part).content as Part[]) ?? [])
        .filter((p: Part) => p.type === "text")
        .map((p: Part) => p.text as string)
        .join("")
    : "";

  return (
    <MessagePrimitive.Root
      style={[
        s.message,
        isUser ? s.messageUser : s.messageAssistant
      ]}
    >
      {/* AI 头像 */}
      {!isUser ? (
        <View style={s.avatar}>
          <Text style={s.avatarText}>AI</Text>
        </View>
      ) : null}

      <View style={isUser ? s.userContentWrap : s.assistantContentWrap}>
        {!isUser ? <Text style={s.senderName}>智能助手</Text> : null}

        {/* 用户消息 */}
        {isUser ? (
          <View style={s.userBubble}>
            {/* 附件内嵌在气泡里 */}
            {(message as Part).attachments?.length > 0 ? (
              <View style={s.attachmentGrid}>
                {((message as Part).attachments as Part[]).map((rawAttachment, index) => {
                  const att = normalizeMessageAttachment(rawAttachment, index);
                  const img = isImage(att.mimeType);
                  const iconUri = img ? null : getFileIconSvg(att.mimeType);
                  if (img) {
                    return (
                      <View key={att.id} style={s.msgImage}>
                        {att.url ? <Image source={{ uri: att.url }} style={s.msgThumb} /> : null}
                      </View>
                    );
                  }
                  return (
                    <View key={att.id} style={s.msgFile}>
                      {iconUri ? <Image source={{ uri: iconUri }} style={s.msgFileIcon} /> : null}
                      <Text numberOfLines={1} style={s.msgFileName}>{att.name}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
            {userText ? <Text style={s.userText}>{userText}</Text> : null}
          </View>
        ) : (
          /* AI 消息 */
          <View style={s.assistantBubble}>
            <MessagePrimitive.Content
              renderText={({ part }: { part: Part }) => (
                <View style={{ minWidth: 0 }}>
                  <MarkdownRenderer content={part.text as string} />
                </View>
              )}
              renderToolCall={({ part }: { part: Part }) => (
                <AssistantToolCard
                  toolName={(part.toolName as string) ?? ""}
                  status={(part.status as AssistantToolCardStatus) ?? "pending"}
                  args={part.args as unknown}
                  result={part.result as unknown}
                  errorText={part.errorText as string | undefined}
                />
              )}
            />
          </View>
        )}

        {/* 流式输入动画 */}
        {isStreaming ? <TypingIndicator /> : null}

        {/* 状态标签 */}
        {(message as Part).status === "failed" ? (
          <StatusPill tone="danger" text={(message as Part).error ?? "生成失败"} />
        ) : null}
        {(message as Part).status === "cancelled" ? (
          <StatusPill tone="muted" text="已停止" />
        ) : null}

        {/* 操作按钮栏 — 仅 AI 消息且非流式中显示 */}
        {!isUser && !isStreaming && (message as Part).status !== "failed" ? (
          <View style={s.actionBar}>
            <ActionBarPrimitive.Copy style={s.actionButton}>
              <Copy size={14} color={tokens.color.textMuted} strokeWidth={2} />
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload style={s.actionButton}>
              <RefreshCw size={14} color={tokens.color.textMuted} strokeWidth={2} />
            </ActionBarPrimitive.Reload>
          </View>
        ) : null}
      </View>
    </MessagePrimitive.Root>
  );
}

function normalizeMessageAttachment(
  attachment: Part,
  index: number
): {
  id: string;
  mimeType: string;
  name: string;
  url?: string;
} {
  const dataPart = ((attachment.content as Part[] | undefined) ?? []).find(
    (part) => part?.type === "data" && part?.name === "attachment"
  );
  const data = dataPart?.data as Part | undefined;
  const mimeType =
    (attachment.mimeType as string | undefined) ??
    (attachment.contentType as string | undefined) ??
    (data?.mimeType as string | undefined) ??
    inferMimeTypeFromAttachmentType(attachment.type as string | undefined);

  return {
    id: String((attachment.id as string | undefined) ?? data?.id ?? index),
    mimeType,
    name:
      (attachment.name as string | undefined) ??
      (attachment.filename as string | undefined) ??
      (data?.name as string | undefined) ??
      "附件",
    url:
      (attachment.url as string | undefined) ??
      (data?.url as string | undefined)
  };
}

function inferMimeTypeFromAttachmentType(type: string | undefined): string {
  if (type === "image") return "image/*";
  if (type === "audio") return "audio/*";
  return "application/octet-stream";
}

/* ── 子组件 ── */

function TypingIndicator(): ReactElement {
  return (
    <View style={s.typing}>
      <View style={s.typingDot} />
      <View style={s.typingDot} />
      <View style={s.typingDot} />
    </View>
  );
}

function StatusPill({
  text,
  tone
}: {
  text: string;
  tone: "danger" | "muted";
}): ReactElement {
  return (
    <View style={[s.statusPill, tone === "danger" ? s.statusPillDanger : s.statusPillMuted]}>
      <Text style={[s.statusPillText, tone === "danger" ? s.statusPillTextDanger : s.statusPillTextMuted]}>
        {text}
      </Text>
    </View>
  );
}

export type AssistantToolCardStatus = "pending" | "running" | "done" | "failed";

/* ── 样式 — 关键：maxWidth 约束防止溢出 ── */

const s = {
  message: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: tokens.spacing.xl,
    width: "100%" as const
  },
  messageUser: {
    justifyContent: "flex-end" as const
  },
  messageAssistant: {
    justifyContent: "flex-start" as const
  },
  avatar: {
    alignItems: "center" as const,
    backgroundColor: tokens.color.accent,
    borderRadius: 14,
    height: 28,
    justifyContent: "center" as const,
    marginTop: 2,
    width: 28,
    flexShrink: 0
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700" as const
  },
  userContentWrap: {
    maxWidth: "75%" as const,
    minWidth: 0
  },
  assistantContentWrap: {
    flex: 1,
    minWidth: 0
  },
  senderName: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.small.fontSize,
    marginBottom: tokens.spacing.xs
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
  userText: {
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight
  },
  typing: {
    flexDirection: "row" as const,
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
  actionBar: {
    flexDirection: "row" as const,
    gap: 2,
    marginTop: tokens.spacing.sm
  },
  actionButton: {
    padding: 6,
    borderRadius: 6
  },
  statusPill: {
    alignSelf: "flex-start" as const,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: tokens.spacing.xs
  },
  statusPillDanger: {
    backgroundColor: tokens.color.dangerBg
  },
  statusPillMuted: {
    backgroundColor: "#f1f3f4"
  },
  statusPillText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: "600" as const
  },
  statusPillTextDanger: {
    color: tokens.color.danger
  },
  statusPillTextMuted: {
    color: tokens.color.textSecondary
  },
  // 附件
  attachmentGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: tokens.spacing.sm
  },
  msgImage: { width: 60, height: 60, borderRadius: 8, overflow: "hidden" as const, marginBottom: 4 },
  msgThumb: { width: "100%" as const, height: "100%" as const },
  msgFile: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginBottom: 2, maxWidth: "100%" as const },
  msgFileIcon: { width: 20, height: 20, flexShrink: 0 },
  msgFileName: {
    fontSize: 11,
    color: tokens.color.textSecondary
  }
};
