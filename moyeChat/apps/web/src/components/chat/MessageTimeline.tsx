"use client";

import type { ChatAttachment, ChatMessage, ChatRole, MessageId } from "@agent-chat/chat-core";
import { isImage, getFileIconSvg } from "@agent-chat/utils";
import { ActionIcon, Text } from "@lobehub/ui";
import { ChatItem } from "@lobehub/ui/chat";
import {
  AlertCircle, Ban, Check, Copy, Edit,
  FileImage as FileImageIcon,
  Loader2, Redo, Trash
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

interface MessageTimelineProps {
  messages: readonly ChatMessage[];
  onDeleteMessage?(messageId: MessageId): void;
  onEditMessage?(messageId: MessageId, content: string): void;
  onExamplePrompt?(prompt: string): void;
  onRetryMessage?(messageId: MessageId): void;
}

const roleMeta: Record<ChatRole, { avatar: string; backgroundColor: string; label: string }> = {
  assistant: { avatar: "AI", backgroundColor: "#eef2ff", label: "助手" },
  system: { avatar: "SYS", backgroundColor: "#fef3c7", label: "系统" },
  tool: { avatar: "TL", backgroundColor: "#dcfce7", label: "工具" },
  user: { avatar: "ME", backgroundColor: "#dbeafe", label: "用户" }
};

const examples = ["帮我总结这段需求", "生成一个发布检查清单", "分析当前页面的可用性问题"];

export function MessageTimeline({
  messages,
  onDeleteMessage,
  onEditMessage,
  onExamplePrompt,
  onRetryMessage
}: MessageTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<MessageId>();
  const [editingMessageId, setEditingMessageId] = useState<MessageId>();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const groups = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement === null) {
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  return (
    <div ref={scrollRef} style={styles.scroll}>
      <div style={styles.inner}>
        {messages.length === 0 ? <EmptyState onExamplePrompt={onExamplePrompt} /> : null}
        {groups.map((group) => {
          return (
            <Fragment key={group.id}>
              {group.messages.map((message, index) => (
                <ChatItem
                  actions={
                    <MessageActions
                      copied={copiedMessageId === message.id}
                      message={message}
                      onCopy={async () => {
                        await navigator.clipboard.writeText(message.content);
                        setCopiedMessageId(message.id);
                        window.setTimeout(() => setCopiedMessageId(undefined), 1200);
                      }}
                      onDelete={onDeleteMessage}
                      onEdit={() => setEditingMessageId(message.id)}
                      onRetry={onRetryMessage}
                    />
                  }
                  avatar={{
                    avatar: roleMeta[message.role].avatar,
                    backgroundColor: roleMeta[message.role].backgroundColor,
                    title: roleMeta[message.role].label
                  }}
                  belowMessage={
                    <MessageMeta message={message} />
                  }
                  editing={editingMessageId === message.id}
                  error={
                    message.status === "failed"
                      ? { message: message.error ?? "生成出错", type: "error" }
                      : undefined
                  }
                  loading={message.status === "streaming" || message.status === "queued"}
                  message={message.content}
                  renderMessage={
                    message.role === "user" && message.attachments.length > 0
                      ? (content: React.ReactNode) => (
                          <div>
                            <AttachmentCards attachments={message.attachments} />
                            {content}
                          </div>
                        )
                      : undefined
                  }
                  messageExtra={message.status === "streaming" ? <span style={styles.cursor} /> : undefined}
                  onChange={(content) => {
                    onEditMessage?.(message.id, content);
                    setEditingMessageId(undefined);
                  }}
                  onEditingChange={(editing) => setEditingMessageId(editing ? message.id : undefined)}
                  placement={message.role === "user" ? "right" : "left"}
                  primary={message.role === "user"}
                  showTitle={index === 0}
                  text={{
                    cancel: "取消",
                    confirm: "保存",
                    edit: "编辑",
                    title: roleMeta[message.role].label
                  }}
                  time={isClient ? new Date(message.updatedAt).getTime() : undefined}
                  variant="bubble"
                />
              ))}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MessageMeta({ message }: { message: ChatMessage }) {
  const status = getStatusMeta(message);
  if (status === undefined) return null;

  const StatusIcon = status.icon;

  return (
    <div style={styles.messageMeta}>
      <span style={{ ...styles.status, ...status.style }}>
        <StatusIcon size={12} style={message.status === "streaming" ? styles.spin : undefined} />
        {status.label}
      </span>
    </div>
  );
}

function AttachmentCards({ attachments }: { attachments: readonly ChatAttachment[] }) {
  return attachments.map((attachment) => {
    const img = isImage(attachment.mimeType);
    const iconSvg = img ? null : getFileIconSvg(attachment.mimeType);
    if (img) {
      return attachment.url ? (
        <img key={attachment.id} src={attachment.url} alt={attachment.name} style={styles.msgThumbnail} />
      ) : null;
    }
    return (
      <span key={attachment.id} style={styles.msgFileCard}>
        {iconSvg ? <img src={iconSvg} alt="" style={styles.msgFileIcon} /> : null}
        <span style={styles.msgFileName}>{attachment.name}</span>
      </span>
    );
  }).filter(Boolean);
}

function getStatusMeta(message: ChatMessage) {
  switch (message.status) {
    case "streaming":
      return { icon: Loader2, label: "生成中", style: styles.statusInfo };
    case "failed":
      return { icon: AlertCircle, label: message.error ?? "生成失败", style: styles.statusDanger };
    case "cancelled":
      return { icon: Ban, label: "已停止", style: styles.statusMuted };
    case "queued":
      return { icon: Loader2, label: "等待中", style: styles.statusInfo };
    default:
      return undefined;
  }
}

function MessageActions({
  copied,
  message,
  onCopy,
  onDelete,
  onEdit,
  onRetry
}: {
  copied: boolean;
  message: ChatMessage;
  onCopy(): void | Promise<void>;
  onDelete?(messageId: MessageId): void;
  onEdit(): void;
  onRetry?(messageId: MessageId): void;
}) {
  const canEdit = message.role === "user" && message.status === "complete";
  const canRetry = message.role !== "user" && message.status !== "streaming" && message.status !== "queued";

  return (
    <div style={styles.messageActions}>
      <ActionIcon icon={copied ? Check : Copy} onClick={onCopy} size="small" title={copied ? "已复制" : "复制"} />
      {canEdit ? <ActionIcon icon={Edit} onClick={onEdit} size="small" title="编辑" /> : null}
      {canRetry ? <ActionIcon icon={Redo} onClick={() => onRetry?.(message.id)} size="small" title="重新生成" /> : null}
      <ActionIcon danger icon={Trash} onClick={() => onDelete?.(message.id)} size="small" title="删除" />
    </div>
  );
}

function EmptyState({ onExamplePrompt }: { onExamplePrompt?: (prompt: string) => void }) {
  return (
    <section style={styles.emptyPanel}>
      <div style={styles.illustration}>
        <div style={styles.illustrationBlockWide} />
        <div style={styles.illustrationRow}>
          <div style={styles.illustrationBlock} />
          <div style={styles.illustrationBlockSoft} />
        </div>
        <div style={styles.illustrationLine} />
      </div>
      <div>
        <Text strong style={styles.emptyTitle}>开始一次 Agent 协作</Text>
        <p style={styles.emptyCopy}>可以让它帮你整理需求、生成计划、检查代码思路，发送后会展示流式回复和工具调用状态。</p>
        <div style={styles.prompts}>
          {examples.map((prompt) => (
            <button key={prompt} onClick={() => onExamplePrompt?.(prompt)} style={styles.promptButton} type="button">
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function groupMessages(messages: readonly ChatMessage[]) {
  return messages.reduce<Array<{ id: string; messages: ChatMessage[]; role: ChatRole }>>((groups, message) => {
    const previous = groups.at(-1);
    if (previous !== undefined && previous.role === message.role && message.role !== "user") {
      previous.messages.push(message);
      return groups;
    }

    groups.push({ id: message.id, role: message.role, messages: [message] });
    return groups;
  }, []);
}

const styles = {
  scroll: {
    background: "transparent",
    height: "100%",
    minHeight: 0,
    overflowY: "auto" as const
  },
  inner: {
    display: "grid",
    gap: 18,
    margin: "0 auto",
    maxWidth: 860,
    padding: "28px 32px 36px"
  },
  emptyPanel: {
    alignItems: "center",
    background: "var(--bg-sidebar)",
    border: "1px solid var(--border-soft)",
    borderRadius: 24,
    boxShadow: "var(--shadow-lg)",
    display: "grid",
    gap: 24,
    gridTemplateColumns: "220px minmax(0, 1fr)",
    margin: "44px auto",
    maxWidth: 780,
    padding: 28
  },
  illustration: {
    background: "linear-gradient(180deg, #f8fafc, #eef6ff)",
    border: "1px solid var(--border-medium)",
    borderRadius: 18,
    display: "grid",
    gap: 12,
    padding: 18
  },
  illustrationBlockWide: {
    background: "#dbeafe",
    borderRadius: 12,
    height: 54
  },
  illustrationRow: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr"
  },
  illustrationBlock: {
    background: "#bbf7d0",
    borderRadius: 12,
    height: 70
  },
  illustrationBlockSoft: {
    background: "#fde68a",
    borderRadius: 12,
    height: 70
  },
  illustrationLine: {
    background: "#cbd5e1",
    borderRadius: 999,
    height: 10,
    width: "70%"
  },
  emptyTitle: {
    display: "block",
    fontSize: 22,
    marginBottom: 8
  },
  emptyCopy: {
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: "0 0 18px"
  },
  prompts: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10
  },
  promptButton: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-medium)",
    borderRadius: 999,
    color: "var(--text-secondary)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    padding: "8px 12px"
  },
  messageActions: {
    alignItems: "center",
    display: "flex",
    gap: 4
  },
  msgThumbnail: { maxWidth: 240, maxHeight: 200, borderRadius: 8, marginBottom: 4, objectFit: "cover" as const },
  msgFileIcon: { width: 20, height: 20, flexShrink: 0 },
  msgFileCard: { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, marginRight: 12 },
  msgFileName: { fontSize: 13, color: "var(--text-primary)", overflow: "hidden" as const, textOverflow: "ellipsis" as const, whiteSpace: "nowrap" as const, maxWidth: 160 },
  messageMeta: {
    display: "grid",
    gap: 8,
    marginTop: 8
  },
  status: {
    alignItems: "center",
    borderRadius: 999,
    display: "inline-flex",
    fontSize: 12,
    gap: 5,
    justifySelf: "start",
    padding: "4px 8px"
  },
  statusInfo: {
    background: "#eff6ff",
    color: "#1d4ed8"
  },
  statusDanger: {
    background: "#fef2f2",
    color: "#b91c1c"
  },
  statusMuted: {
    background: "var(--bg-input)",
    color: "var(--text-muted)"
  },
  cursor: {
    animation: "moye-caret 1s steps(2, start) infinite",
    background: "#111827",
    display: "inline-block",
    height: 16,
    marginLeft: 3,
    transform: "translateY(2px)",
    width: 2
  },
  spin: {
    animation: "moye-spin 1s linear infinite"
  }
};
