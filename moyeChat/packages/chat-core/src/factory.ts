import { createId, nowIso } from "@agent-chat/utils";

import type {
  ChatMessage,
  ChatState,
  Conversation,
  CreateConversationInput,
  CreateMessageInput
} from "./types";

export function createInitialChatState(): ChatState {
  return {
    conversations: {},
    messages: {},
    requestIdsByConversation: {},
    tags: {}
  };
}

export function createConversation(input: CreateConversationInput = {}): Conversation {
  const now = input.now ?? nowIso();

  return {
    id: input.id ?? createId("conv"),
    title: input.title ?? "New conversation",
    messageIds: [],
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata
  };
}

export function createMessage(input: CreateMessageInput): ChatMessage {
  const now = input.now ?? nowIso();

  return {
    id: input.id ?? createId("msg"),
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    status: input.status ?? "queued",
    createdAt: now,
    updatedAt: now,
    requestId: input.requestId,
    toolCalls: [],
    attachments: input.attachments ?? [],
    metadata: input.metadata
  };
}
