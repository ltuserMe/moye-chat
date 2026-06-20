import type { ChatAttachment } from "@agent-chat/chat-core";
import { Mic, Plus, Send, Square } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";
import type { ComposerAction, ComposerActionId, QuickPrompt } from "../types";
import { ActionPanel } from "./ActionPanel";
import { AttachmentRail } from "./AttachmentRail";

export function Composer({
  actionPanelOpen,
  actions,
  attachments,
  compact,
  inputHeight,
  isSending,
  isTiny,
  quickPrompts,
  value,
  onAction,
  onActionPanelToggle,
  onAttachmentsChange,
  onContentSizeChange,
  onInputChange,
  onMicPress,
  onSend
}: {
  actionPanelOpen: boolean;
  actions: readonly ComposerAction[];
  attachments: readonly ChatAttachment[];
  compact?: boolean;
  inputHeight: number;
  isSending?: boolean;
  isTiny?: boolean;
  quickPrompts: readonly QuickPrompt[];
  value: string;
  onAction(actionId: ComposerActionId): void;
  onActionPanelToggle(): void;
  onAttachmentsChange(attachments: readonly ChatAttachment[]): void;
  onContentSizeChange(height: number): void;
  onInputChange(value: string): void;
  onMicPress?(): void;
  onSend(): void;
}): ReactElement {
  const hasInput = value.trim().length > 0 || attachments.length > 0;

  return (
    <>
      {!isTiny ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTools} contentContainerStyle={styles.quickToolsContent}>
          {quickPrompts.map((prompt) => (
            <Pressable
              accessibilityRole="button"
              key={prompt.label}
              onPress={() => onInputChange(prompt.label)}
              style={({ pressed }) => [styles.toolChip, compact && styles.toolChipCompact, pressed && styles.toolChipPressed]}
            >
              <Text style={styles.toolChipIcon}>{prompt.icon}</Text>
              <Text style={[styles.toolChipText, compact && styles.toolChipTextCompact]}>{prompt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.inputBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onActionPanelToggle}
          style={({ pressed }) => [styles.plusButton, compact && styles.plusButtonCompact, actionPanelOpen && styles.plusButtonActive, pressed && styles.buttonPressed]}
        >
          <View style={[styles.plusIcon, actionPanelOpen && styles.plusIconActive]}>
            <Plus color={tokens.color.textSecondary} size={20} strokeWidth={2.2} />
          </View>
        </Pressable>
        <TextInput
          multiline
          onChangeText={onInputChange}
          onContentSizeChange={(event) => onContentSizeChange(event.nativeEvent.contentSize.height)}
          placeholder={compact ? "输入指令" : "输入指令..."}
          placeholderTextColor={tokens.color.textMuted}
          style={[styles.input, { height: inputHeight }, compact && styles.inputCompact]}
          value={value}
        />
        <View style={[styles.rightActions, compact && styles.rightActionsCompact]}>
          {hasInput || isSending ? (
            <Pressable accessibilityRole="button" onPress={onSend} style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}>
              {isSending ? <Square color="#ffffff" fill="#ffffff" size={12} strokeWidth={2.2} /> : <Send color="#ffffff" fill="#ffffff" size={14} strokeWidth={2.2} />}
            </Pressable>
          ) : (
            <Pressable accessibilityLabel="语音输入" accessibilityRole="button" onPress={onMicPress} style={({ pressed }) => [styles.micButton, pressed && styles.buttonPressed]}>
              <Mic color={tokens.color.textMuted} size={20} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>
      </View>

      <ActionPanel actions={actions} compact={compact} open={actionPanelOpen} onAction={onAction} />
      <AttachmentRail attachments={attachments} onChange={onAttachmentsChange} />
    </>
  );
}

const styles = StyleSheet.create({
  quickTools: {
    flexGrow: 0
  },
  quickToolsContent: {
    gap: tokens.spacing.sm,
    paddingRight: tokens.spacing.xs
  },
  toolChip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  toolChipCompact: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  toolChipPressed: {
    backgroundColor: tokens.color.inputMuted,
    transform: [{ scale: 0.98 }]
  },
  toolChipIcon: {
    color: tokens.color.textSecondary,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: "700"
  },
  toolChipText: {
    color: tokens.color.textSecondary,
    fontSize: 13
  },
  toolChipTextCompact: {
    fontSize: tokens.typography.caption.fontSize
  },
  inputBar: {
    alignItems: "flex-end",
    backgroundColor: tokens.color.inputMuted,
    borderRadius: tokens.radius.xl,
    flexDirection: "row",
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xs,
    paddingLeft: tokens.spacing.md,
    paddingRight: tokens.spacing.xs,
    paddingTop: tokens.spacing.xs
  },
  plusButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginBottom: 2,
    width: 32
  },
  plusButtonCompact: {
    height: 30,
    marginBottom: 1,
    width: 30
  },
  plusButtonActive: {
    backgroundColor: "#e0e0e0"
  },
  plusIcon: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
    transform: [{ rotate: "0deg" }],
    width: 20
  },
  plusIconActive: {
    transform: [{ rotate: "45deg" }]
  },
  input: {
    color: tokens.color.text,
    flex: 1,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: 20,
    overflow: "hidden",
    paddingBottom: tokens.spacing.sm,
    paddingHorizontal: 0,
    paddingTop: tokens.spacing.sm,
    textAlignVertical: "top"
  },
  inputCompact: {
    fontSize: 14,
    paddingBottom: 7,
    paddingTop: 7
  },
  rightActions: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginBottom: 2,
    marginRight: 2,
    width: 32
  },
  rightActionsCompact: {
    height: 30,
    marginBottom: 1,
    marginRight: 1,
    width: 30
  },
  micButton: {
    alignItems: "center",
    borderRadius: 16,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: tokens.color.accent,
    borderRadius: 16,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  sendButtonPressed: {
    transform: [{ scale: 0.92 }]
  },
  buttonPressed: {
    backgroundColor: "#e8eaed"
  }
});
