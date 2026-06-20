import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react-native";

import { assistantTheme as t } from "@/theme/assistant-theme";
import { mobileTokens as tokens } from "@/components/chat/theme/tokens";

interface AssistantToolCardProps {
  toolName: string;
  status: "pending" | "running" | "done" | "failed";
  args?: unknown;
  result?: unknown;
  errorText?: string;
}

const statusMeta = {
  done: { color: tokens.color.traceSuccess, icon: CheckCircle2, label: "已完成" },
  failed: { color: tokens.color.danger, icon: AlertCircle, label: "失败" },
  pending: { color: tokens.color.textMuted, icon: Clock3, label: "等待中" },
  running: { color: tokens.color.traceProgress, icon: Loader2, label: "运行中" }
} as const;

/**
 * 工具调用卡片
 * 替代原来 MessageBubble 内部的 ToolTracePanel
 */
export function AssistantToolCard({
  toolName,
  status,
  args,
  result,
  errorText
}: AssistantToolCardProps): ReactElement {
  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  return (
    <View style={t.toolCard}>
      {/* 头部: 状态图标 + 工具名 + 状态标签 */}
      <View style={t.toolHeader}>
        <StatusIcon
          size={15}
          color={meta.color}
          strokeWidth={2.2}
        />
        <Text style={t.toolName}>{toolName}</Text>
        <View
          style={[
            t.statusPill,
            status === "failed"
              ? t.statusPillDanger
              : { backgroundColor: "#e8f0fe" }
          ]}
        >
          <Text
            style={[
              t.statusPillText,
              status === "failed"
                ? t.statusPillTextDanger
                : { color: meta.color }
            ]}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      {/* 参数 */}
      {args !== undefined ? (
        <CodeBlock label="参数" value={formatValue(args)} />
      ) : null}

      {/* 结果 */}
      {result !== undefined ? (
        <CodeBlock label="结果" value={formatValue(result)} />
      ) : null}

      {/* 错误 */}
      {errorText ? (
        <CodeBlock label="错误" value={errorText} danger />
      ) : null}
    </View>
  );
}

function CodeBlock({
  label,
  value,
  danger
}: {
  label: string;
  value: string;
  danger?: boolean;
}): ReactElement {
  return (
    <View>
      <Text style={danger ? t.blockLabelDanger : t.blockLabel}>{label}</Text>
      <View style={danger ? t.codeBlockDanger : t.codeBlock}>
        <Text style={danger ? t.codeTextDanger : t.codeText}>{value}</Text>
      </View>
    </View>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
