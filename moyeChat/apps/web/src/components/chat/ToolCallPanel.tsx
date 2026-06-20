"use client";

import type { ChatMessage, ToolCall, ToolCallStatus } from "@agent-chat/chat-core";
import { Tag, Text } from "@lobehub/ui";
import { AlertCircle, CheckCircle2, Clock3, Loader2, Wrench } from "lucide-react";
import { useMemo } from "react";

interface ToolCallPanelProps {
  messages: readonly ChatMessage[];
}

interface ToolCallEntry {
  messageId: string;
  toolCall: ToolCall;
}

const statusMeta: Record<
  ToolCallStatus,
  {
    color: "blue" | "cyan" | "green" | "red";
    icon: typeof Clock3;
    label: string;
  }
> = {
  done: { color: "green", icon: CheckCircle2, label: "已完成" },
  failed: { color: "red", icon: AlertCircle, label: "失败" },
  pending: { color: "cyan", icon: Clock3, label: "等待中" },
  running: { color: "blue", icon: Loader2, label: "运行中" }
};

export function ToolCallPanel({ messages }: ToolCallPanelProps) {
  const entries = useMemo<ToolCallEntry[]>(
    () =>
      messages.flatMap((message) =>
        message.toolCalls.map((toolCall) => ({
          messageId: message.id,
          toolCall
        }))
      ),
    [messages]
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <aside style={styles.panel}>
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <Wrench size={16} strokeWidth={2.2} />
          <Text strong style={styles.title}>工具调用</Text>
        </div>
        <Tag color="blue">{entries.length}</Tag>
      </header>

      <div style={styles.list}>
        {entries.map(({ messageId, toolCall }) => (
          <ToolCallCard key={`${messageId}-${toolCall.id}`} toolCall={toolCall} />
        ))}
      </div>
    </aside>
  );
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const meta = statusMeta[toolCall.status];
  const StatusIcon = meta.icon;

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.nameRow}>
          <StatusIcon size={15} strokeWidth={2.2} style={toolCall.status === "running" ? styles.spin : undefined} />
          <span style={styles.toolName}>{toolCall.name}</span>
        </div>
        <Tag color={meta.color}>{meta.label}</Tag>
      </div>

      {toolCall.argumentsText ? <CodeBlock label="参数" value={toolCall.argumentsText} /> : null}
      {toolCall.result !== undefined ? <CodeBlock label="结果" value={formatJsonValue(toolCall.result)} /> : null}
      {toolCall.error ? <CodeBlock danger label="错误" value={toolCall.error} /> : null}
    </article>
  );
}

function CodeBlock({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <div style={styles.block}>
      <div style={danger ? styles.blockLabelDanger : styles.blockLabel}>{label}</div>
      <pre style={danger ? styles.errorCode : styles.code}>{value}</pre>
    </div>
  );
}

function formatJsonValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

const styles = {
  panel: {
    background: "var(--bg-panel)",
    borderLeft: "1px solid var(--border-medium)",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: 0,
    width: 320
  },
  header: {
    alignItems: "center",
    borderBottom: "1px solid var(--border-medium)",
    display: "flex",
    justifyContent: "space-between",
    padding: "18px 18px 14px"
  },
  titleRow: {
    alignItems: "center",
    color: "var(--text-primary)",
    display: "flex",
    gap: 8
  },
  title: {
    fontSize: 14
  },
  list: {
    display: "grid",
    gap: 12,
    minHeight: 0,
    overflowY: "auto" as const,
    padding: 16
  },
  card: {
    background: "var(--bg-sidebar)",
    border: "1px solid var(--border-medium)",
    borderRadius: 8,
    boxShadow: "var(--shadow-lg)",
    display: "grid",
    gap: 12,
    padding: 14
  },
  cardHeader: {
    alignItems: "flex-start",
    display: "flex",
    gap: 10,
    justifyContent: "space-between"
  },
  nameRow: {
    alignItems: "center",
    color: "var(--text-primary)",
    display: "flex",
    gap: 8,
    minWidth: 0
  },
  toolName: {
    fontSize: 13,
    fontWeight: 700,
    overflowWrap: "anywhere" as const
  },
  block: {
    display: "grid",
    gap: 6
  },
  blockLabel: {
    color: "var(--text-muted)",
    fontSize: 11,
    fontWeight: 700
  },
  blockLabelDanger: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: 700
  },
  code: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-medium)",
    borderRadius: 6,
    color: "var(--text-secondary)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 11,
    lineHeight: 1.55,
    margin: 0,
    maxHeight: 180,
    overflow: "auto" as const,
    padding: 10,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const
  },
  errorCode: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    color: "#991b1b",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 11,
    lineHeight: 1.55,
    margin: 0,
    maxHeight: 180,
    overflow: "auto" as const,
    padding: 10,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const
  },
  spin: {
    animation: "tool-call-spin 1s linear infinite"
  }
};
