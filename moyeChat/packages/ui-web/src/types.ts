import type { ChatMessage, Conversation, ConversationId } from "@agent-chat/chat-core";

export interface ConversationListItem extends Conversation {
  unreadCount?: number;
}

export interface ChatShellProps {
  activeConversationId?: ConversationId;
  conversations: readonly ConversationListItem[];
  messages: readonly ChatMessage[];
  isSending?: boolean;
  inputValue: string;
  onInputChange(value: string): void;
  onSend(): void;
  onCancel?(): void;
  onSelectConversation(conversationId: ConversationId): void;
  onCreateConversation(): void;
}
