import type { ChatMessage } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  bottomPadding,
  compact,
  messages,
  showStreaming,
  onDrag,
  onExamplePrompt
}: {
  bottomPadding: number;
  compact?: boolean;
  messages: readonly ChatMessage[];
  showStreaming: boolean;
  onDrag?(): void;
  onExamplePrompt(prompt: string): void;
}): ReactElement {
  return (
    <FlatList
      contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingBottom: bottomPadding }]}
      data={[...messages]}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(message) => message.id}
      ListEmptyComponent={<EmptyState onPrompt={onExamplePrompt} />}
      onScrollBeginDrag={onDrag}
      renderItem={({ item }) => <MessageBubble message={item} showStreaming={showStreaming} />}
    />
  );
}

function EmptyState({ onPrompt }: { onPrompt(prompt: string): void }): ReactElement {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>开始一次移动端 Agent 协作</Text>
      <Text style={styles.emptyCopy}>消息流、Trace、快捷输入和发送状态都在这里实时展示。</Text>
      <Pressable onPress={() => onPrompt("帮我审查这版移动端体验")} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>填入示例需求</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg
  },
  contentCompact: {
    gap: 18,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md
  },
  emptyState: {
    alignItems: "flex-start",
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
    fontWeight: "700"
  }
});
