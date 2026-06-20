import type { ChatAttachment, Conversation, ConversationId } from "@agent-chat/chat-core";

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
  conversations: readonly Conversation[];
  isCompact?: boolean;
  isDrawerOpen: boolean;
  isSending?: boolean;
  isTiny?: boolean;
  listBottomPadding: number;
  quickPrompts: readonly QuickPrompt[];
  onActionPanelToggle(): void;
  onAttachmentsChange(attachments: readonly ChatAttachment[]): void;
  onBottomLayout(height: number): void;
  onComposerAction(actionId: ComposerActionId): void;
  onCreateConversation(): void;
  onDrawerClose(): void;
  onDrawerOpen(): void;
  onMessageListDrag?(): void;
  onMicPress?(): void;
  onSelectConversation(conversationId: ConversationId): void;
  onDeleteConversation?(conversationId: ConversationId): void;
  onRenameConversation?(conversationId: ConversationId, title: string): void;
  onDeleteMessage?(messageId: string): void;
  onEditMessage?(messageId: string, content: string): void;
}
