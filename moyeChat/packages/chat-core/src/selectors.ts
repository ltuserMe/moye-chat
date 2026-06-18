import type { ChatMessage, ChatState, Conversation, ConversationId, MessageId } from "./types";

export function selectActiveConversation(state: ChatState): Conversation | undefined {
  return state.activeConversationId === undefined
    ? undefined
    : state.conversations[state.activeConversationId];
}

export function selectConversationMessages(
  state: ChatState,
  conversationId: ConversationId
): readonly ChatMessage[] {
  const conversation = state.conversations[conversationId];
  if (conversation === undefined) {
    return [];
  }

  return conversation.messageIds
    .map((messageId) => state.messages[messageId])
    .filter((message): message is ChatMessage => message !== undefined);
}

export function selectMessage(state: ChatState, messageId: MessageId): ChatMessage | undefined {
  return state.messages[messageId];
}

export function selectConversations(state: ChatState): readonly Conversation[] {
  return Object.values(state.conversations).toSorted((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}
