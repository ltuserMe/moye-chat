import type { ReactElement } from "react";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  ComposerPrimitive,
  type CreateAttachment,
  useAui,
  useAuiState
} from "@assistant-ui/react-native";
import { Mic, Plus, Send, Square } from "lucide-react-native";
import type { ChatAttachment } from "@agent-chat/chat-core";

import { assistantTheme as t } from "@/theme/assistant-theme";
import { mobileTokens as tokens } from "@/components/chat/theme/tokens";
import type { QuickPrompt } from "@/components/chat/types";
import { ActionPanel } from "@/components/chat/components/ActionPanel";
import { AssistantAttachmentRail } from "./AssistantAttachmentRail";

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
  onMicPress?(): void;
}

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
  const aui = useAui();
  const composerText = useAuiState((s) => s.composer.text);
  const composerAttachments = useAuiState((s) => s.composer.attachments);
  const hasInput = composerText.trim().length > 0 || attachments.length > 0;
  const sentAttachmentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(
      attachments.map((attachment) => String(attachment.id))
    );
    for (const id of sentAttachmentIdsRef.current) {
      if (!currentIds.has(id)) {
        sentAttachmentIdsRef.current.delete(id);
      }
    }
  }, [attachments]);

  useEffect(() => {
    const nextAttachments = attachments.filter(
      (attachment) => !sentAttachmentIdsRef.current.has(String(attachment.id))
    );
    const nextSignature = getAttachmentSignature(nextAttachments);
    const composerSignature = getAttachmentSignature(composerAttachments);

    if (nextSignature === composerSignature) {
      return;
    }

    void (async () => {
      await aui.composer().clearAttachments();
      await Promise.all(
        nextAttachments.map((attachment) =>
          aui.composer().addAttachment(toComposerAttachment(attachment))
        )
      );
    })();
  }, [attachments, aui, composerAttachments]);

  const handleSendPress = useCallback(async () => {
    const composerIds = new Set(
      composerAttachments.map((attachment) => String(attachment.id))
    );

    if (attachments.length > 0) {
      sentAttachmentIdsRef.current = new Set(
        attachments.map((attachment) => String(attachment.id))
      );
    }

    await Promise.all(
      attachments
        .filter((attachment) => !composerIds.has(String(attachment.id)))
        .map((attachment) =>
          aui.composer().addAttachment(toComposerAttachment(attachment))
        )
    );

    aui.composer().send();
  }, [attachments, aui, composerAttachments]);

  return (
    <>
      {/* 附件预览 — 输入框上方 */}
      <AssistantAttachmentRail
        attachments={attachments}
        onChange={onAttachmentsChange}
      />

      {/* 快速提示 */}
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
                pressed && { opacity: 0.5 }
              ]}
            >
              <ComposerText style={t.toolChipIcon}>{prompt.icon}</ComposerText>
              <ComposerText style={t.toolChipText}>{prompt.label}</ComposerText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* 输入区域 */}
      <ComposerPrimitive.Root style={t.composer}>
        <View style={t.inputBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onActionPanelToggle}
            style={({ pressed }) => [
              t.plusButton,
              actionPanelOpen && { backgroundColor: "#e0e0e0" },
              pressed && { opacity: 0.5 }
            ]}
          >
            <View
              style={{
                transform: [{ rotate: actionPanelOpen ? "45deg" : "0deg" }]
              }}
            >
              <Plus color={tokens.color.textSecondary} size={20} strokeWidth={2.2} />
            </View>
          </Pressable>

          <ComposerPrimitive.Input
            multiline
            placeholder={compact ? "输入指令" : "输入指令..."}
            placeholderTextColor={tokens.color.textMuted}
            style={t.input}
          />

          <View style={s.rightActions}>
            {hasInput || isSending ? (
              isSending ? (
                <ComposerPrimitive.Cancel style={t.sendButton}>
                  <Square color="#ffffff" fill="#ffffff" size={12} strokeWidth={2.2} />
                </ComposerPrimitive.Cancel>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleSendPress()}
                  style={t.sendButton}
                >
                  <Send color="#ffffff" fill="#ffffff" size={14} strokeWidth={2.2} />
                </Pressable>
              )
            ) : (
              <Pressable
                accessibilityLabel="语音输入"
                accessibilityRole="button"
                onPress={onMicPress}
                style={({ pressed }) => [s.micButton, pressed && { opacity: 0.5 }]}
              >
                <Mic color={tokens.color.textMuted} size={20} strokeWidth={2.2} />
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
    </>
  );
}

function getAttachmentSignature(
  attachments: readonly { id: unknown }[]
): string {
  return attachments
    .map((attachment) => String(attachment.id))
    .sort()
    .join("|");
}

function toComposerAttachment(attachment: ChatAttachment): CreateAttachment {
  const type = attachment.mimeType.startsWith("image/") ? "image" : "document";

  return {
    id: attachment.id,
    type,
    name: attachment.name,
    contentType: attachment.mimeType,
    content: [
      {
        type: "data",
        name: "attachment",
        data: {
          id: attachment.id,
          mimeType: attachment.mimeType,
          name: attachment.name,
          size: attachment.size,
          url: attachment.url
        }
      }
    ]
  };
}

// Inline Text helper (avoids import of ThemedText)
function ComposerText({
  children,
  style
}: {
  children: string;
  style: object;
}): ReactElement {
  const { Text: RNText } = require("react-native");
  return <RNText style={style}>{children}</RNText>;
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
