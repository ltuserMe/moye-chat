import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThreadPrimitive, useAui } from "@assistant-ui/react-native";

import { assistantTheme as t } from "@/theme/assistant-theme";
import { mobileTokens as tokens } from "@/components/chat/theme/tokens";
import { AssistantMessage } from "./AssistantMessage";

interface AssistantThreadProps {
  bottomPadding: number;
  isSending: boolean;
}

/**
 * assistant-ui ThreadPrimitive 包装
 * 替代原来的手写 MessageList
 */
export function AssistantThread({
  bottomPadding,
  isSending
}: AssistantThreadProps): ReactElement {
  const aui = useAui();

  return (
    <ThreadPrimitive.Root style={[t.thread, { flex: 1, minWidth: 0 }]}>
      <ThreadPrimitive.Messages
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            onPrompt={(prompt) => aui.composer().setText(prompt)}
          />
        }
        contentContainerStyle={{
          gap: tokens.spacing.xl,
          paddingBottom: bottomPadding
        }}
        style={{ flex: 1 }}
      >
        {({ message }: { message: unknown }): ReactElement => (
          <AssistantMessage message={message as Record<string, unknown>} showStreaming={isSending} />
        )}
      </ThreadPrimitive.Messages>
    </ThreadPrimitive.Root>
  );
}

function EmptyState({
  onPrompt
}: {
  onPrompt(prompt: string): void;
}): ReactElement {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>开始一次移动端 Agent 协作</Text>
      <Text style={styles.emptyCopy}>
        消息流、Trace、快捷输入和发送状态都在这里实时展示。
      </Text>
      <Pressable
        onPress={() => onPrompt("帮我审查这版移动端体验")}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>填入示例需求</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "flex-start" as const,
    backgroundColor: "#ffffff",
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginTop: 20,
    padding: tokens.spacing.lg
  },
  emptyTitle: {
    color: tokens.color.text,
    fontSize: tokens.typography.title.fontSize,
    fontWeight: tokens.typography.title.fontWeight
  },
  emptyCopy: {
    color: tokens.color.textSecondary,
    fontSize: 13,
    lineHeight: 19
  },
  emptyButton: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700" as const
  }
});
