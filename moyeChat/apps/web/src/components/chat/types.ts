import type { ChatMessage, Conversation, ConversationId } from "@agent-chat/chat-core";
import type { ChatAttachment, MessageId } from "@agent-chat/chat-core";

export interface ConversationListItem extends Conversation {
  lastMessagePreview?: string;
  lastMessageRole?: ChatMessage["role"];
  unreadCount?: number;
}

export interface ChatModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ChatShellProps {
  activeConversationId?: ConversationId;
  conversations: readonly ConversationListItem[];
  messages: readonly ChatMessage[];
  isSending?: boolean;
  inputValue: string;
  inputAttachments?: readonly ChatAttachment[];
  models?: readonly ChatModelOption[];
  selectedModelId?: string;
  onInputChange(value: string): void;
  onAttachmentsChange?(attachments: readonly ChatAttachment[]): void;
  onSend(): void;
  onCancel?(): void;
  onExamplePrompt?(prompt: string): void;
  onSelectConversation(conversationId: ConversationId): void;
  onCreateConversation(): void;
  onDeleteConversation?(conversationId: ConversationId): void;
  onRenameConversation?(conversationId: ConversationId, title: string): void;
  onDeleteMessage?(messageId: MessageId): void;
  onEditMessage?(messageId: MessageId, content: string): void;
  onRetryMessage?(messageId: MessageId): void;
  onModelChange?(modelId: string): void;
}
