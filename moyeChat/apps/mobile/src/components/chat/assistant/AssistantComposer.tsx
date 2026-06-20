import type { ReactElement } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import {
  ComposerPrimitive,
  useAuiState
} from "@assistant-ui/react-native";
import { Mic, Plus, Send, Square } from "lucide-react-native";

import { assistantTheme as t } from "@/theme/assistant-theme";
import { mobileTokens as tokens } from "@/components/chat/theme/tokens";
import type { QuickPrompt } from "@/components/chat/types";
import { ActionPanel } from "@/components/chat/components/ActionPanel";
import { AttachmentRail } from "@/components/chat/components/AttachmentRail";
import type { ChatAttachment } from "@agent-chat/chat-core";

interface AssistantComposerProps {
  actionPanelOpen: boolean;
  actions: readonly { id: string; label: string }[];
  attachments: readonly ChatAttachment[];
  compact?: boolean;
  isSending?: boolean;
  isTiny?: boolean;
  quickPrompts: readonly QuickPrompt[];
  onAction(actionId: string): void;
  onActionPanelToggle(): void;
  onAttachmentsChange(attachments: readonly ChatAttachment[]): void;
  onInputChange?(value: string): void;
  onMicPress?(): void;
}

/**
 * assistant-ui ComposerPrimitive 包装
 *
 * ComposerPrimitive.Input + Send 处理文本输入和发送
 * 保留: Mic 按钮, QuickPromptChips, ActionPanel, AttachmentRail
 */
export function AssistantComposer({
  actionPanelOpen,
  actions,
  attachments,
  compact,
  isSending,
  isTiny,
  quickPrompts,
  onAction,
  onActionPanelToggle,
  onAttachmentsChange,
  onMicPress
}: AssistantComposerProps): ReactElement {
  const composerText = useAuiState((s) => s.composer.text);
  const hasInput = composerText.trim().length > 0 || attachments.length > 0;

  return (
    <>
      {/* 快速提示 chips */}
      {!isTiny && quickPrompts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={t.quickTools}
          contentContainerStyle={t.quickToolsContent}
        >
          {quickPrompts.map((prompt) => (
            <Pressable
              accessibilityRole="button"
              key={prompt.label}
              style={({ pressed }) => [
                t.toolChip,
                pressed && { backgroundColor: tokens.color.inputMuted }
              ]}
            >
              <Text style={t.toolChipIcon}>{prompt.icon}</Text>
              <Text style={t.toolChipText}>{prompt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* 输入区域 */}
      <ComposerPrimitive.Root style={t.composer}>
        <View style={t.inputBar}>
          {/* + 按钮 */}
          <Pressable
            accessibilityRole="button"
            onPress={onActionPanelToggle}
            style={({ pressed }) => [
              t.plusButton,
              actionPanelOpen && { backgroundColor: "#e0e0e0" },
              pressed && { backgroundColor: tokens.color.userBubble }
            ]}
          >
            <View
              style={{
                transform: [{ rotate: actionPanelOpen ? "45deg" : "0deg" }]
              }}
            >
              <Plus
                color={tokens.color.textSecondary}
                size={20}
                strokeWidth={2.2}
              />
            </View>
          </Pressable>

          {/* 输入框 */}
          <ComposerPrimitive.Input
            multiline
            placeholder={compact ? "输入指令" : "输入指令..."}
            placeholderTextColor={tokens.color.textMuted}
            style={t.input}
          />

          {/* 右侧按钮: 有输入显示发送/停止, 无输入显示麦克风 */}
          <View style={s.rightActions}>
            {hasInput || isSending ? (
              isSending ? (
                /* 停止按钮 — 发送中 */
                <ComposerPrimitive.Cancel style={t.sendButton}>
                  <Square
                    color="#ffffff"
                    fill="#ffffff"
                    size={12}
                    strokeWidth={2.2}
                  />
                </ComposerPrimitive.Cancel>
              ) : (
                /* 发送按钮 */
                <ComposerPrimitive.Send style={t.sendButton}>
                  <Send
                    color="#ffffff"
                    fill="#ffffff"
                    size={14}
                    strokeWidth={2.2}
                  />
                </ComposerPrimitive.Send>
              )
            ) : (
              /* 麦克风按钮 — 输入为空 */
              <Pressable
                accessibilityLabel="语音输入"
                accessibilityRole="button"
                onPress={onMicPress}
                style={s.micButton}
              >
                <Mic
                  color={tokens.color.textMuted}
                  size={20}
                  strokeWidth={2.2}
                />
              </Pressable>
            )}
          </View>
        </View>
      </ComposerPrimitive.Root>

      {/* 操作面板 */}
      <ActionPanel
        actions={actions as any}
        compact={compact}
        open={actionPanelOpen}
        onAction={onAction as any}
      />

      {/* 附件栏 */}
      <AttachmentRail
        attachments={attachments}
        onChange={onAttachmentsChange}
      />
    </>
  );
}

const s = {
  rightActions: {
    alignItems: "center" as const,
    height: 32,
    justifyContent: "center" as const,
    marginBottom: 2,
    marginRight: 2,
    width: 32
  },
  micButton: {
    alignItems: "center" as const,
    borderRadius: 16,
    height: "100%" as const,
    justifyContent: "center" as const,
    width: "100%" as const
  }
};
