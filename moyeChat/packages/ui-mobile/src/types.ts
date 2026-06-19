import type { ChatAttachment, ChatMessage, Conversation, ConversationId } from "@agent-chat/chat-core";

export type ComposerActionId = "camera" | "database" | "file" | "image";

export interface ComposerAction {
  id: ComposerActionId;
  label: string;
}

export interface QuickPrompt {
  icon: string;
  label: string;
}

export interface ChatScreenViewProps {
  actionPanelOpen: boolean;
  activeConversationId?: ConversationId;
  attachments: readonly ChatAttachment[];
  bottomInset?: number;
  conversations: readonly Conversation[];
  inputHeight: number;
  inputValue: string;
  isCompact?: boolean;
  isDrawerOpen: boolean;
  isSending?: boolean;
  isTiny?: boolean;
  listBottomPadding: number;
  messages: readonly ChatMessage[];
  quickPrompts: readonly QuickPrompt[];
  onActionPanelToggle(): void;
  onAttachmentsChange(attachments: readonly ChatAttachment[]): void;
  onBottomLayout(height: number): void;
  onComposerAction(actionId: ComposerActionId): void;
  onCreateConversation(): void;
  onDrawerClose(): void;
  onDrawerOpen(): void;
  onInputChange(value: string): void;
  onInputContentSizeChange(height: number): void;
  onMessageListDrag?(): void;
  onMicPress?(): void;
  onSelectConversation(conversationId: ConversationId): void;
  onSend(): void;
}
