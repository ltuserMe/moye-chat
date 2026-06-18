"use client";

import type { ChatMessage, ToolCall } from "@agent-chat/chat-core";
import { Tag, Text } from "@lobehub/ui";
import { useMemo } from "react";

interface ToolCallPanelProps {
  messages: readonly ChatMessage[];
}

export function ToolCallPanel({ messages }: ToolCallPanelProps) {
  const toolCalls = useMemo(
    () =>
      messages.flatMap((message) =>
        message.toolCalls.map((toolCall) => ({ ...toolCall, messageId: message.id }))
      ),
    [messages]
  );

  return (
    <aside style={styles.panel}>
      <div style={styles.panelHeader}>
        <Text strong>Tool calls</Text>
        <Tag color="blue">{toolCalls.length}</Tag>
      </div>

      <div style={styles.panelList}>
        {toolCalls.map((toolCall) => (
          <ToolCallCard key={`${toolCall.messageId}-${toolCall.id}`} toolCall={toolCall} />
        ))}
      </div>
    </aside>
  );
}

export function InlineToolCalls({ toolCalls }: { toolCalls: readonly ToolCall[] }) {
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div style={styles.inlineList}>
      {toolCalls.map((toolCall) => (
        <ToolCallCard key={toolCall.id} toolCall={toolCall} compact />
      ))}
    </div>
  );
}

function ToolCallCard({ toolCall, compact = false }: { toolCall: ToolCall; compact?: boolean }) {
  return (
    <div style={{ ...styles.card, padding: compact ? 10 : 12 }}>
      <div style={styles.cardHeader}>
        <Text strong>{toolCall.name}</Text>
        <Tag color={statusColor[toolCall.status]}>{toolCall.status}</Tag>
      </div>
      {toolCall.argumentsText === undefined ? null : <code style={styles.code}>{toolCall.argumentsText}</code>}
      {toolCall.result === undefined ? null : (
        <code style={styles.result}>{JSON.stringify(toolCall.result, null, 2)}</code>
      )}
      {toolCall.error === undefined ? null : <Text type="danger">{toolCall.error}</Text>}
    </div>
  );
}

const statusColor: Record<ToolCall["status"], "blue" | "green" | "red" | "gold"> = {
  pending: "gold",
  running: "blue",
  done: "green",
  failed: "red"
};

const styles = {
  panel: {
    background: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: 0,
    padding: 16,
    width: 336
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16
  },
  panelList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    minHeight: 0,
    overflowY: "auto" as const
  },
  inlineList: {
    display: "grid",
    gap: 8,
    marginTop: 10
  },
  card: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    display: "grid",
    gap: 8
  },
  cardHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between"
  },
  code: {
    background: "#111827",
    borderRadius: 6,
    color: "#f9fafb",
    display: "block",
    maxWidth: "100%",
    overflowX: "auto" as const,
    padding: 8
  },
  result: {
    background: "#eef7f1",
    borderRadius: 6,
    color: "#155724",
    display: "block",
    maxWidth: "100%",
    overflowX: "auto" as const,
    padding: 8
  }
};
