import { nowIso } from "@agent-chat/utils";

import { createConversation, createInitialChatState, createMessage } from "./factory";
import type {
  ChatAction,
  ChatMessage,
  ChatState,
  Conversation,
  MessageId,
  StreamEvent,
  ToolCall
} from "./types";

export function chatReducer(state: ChatState = createInitialChatState(), action: ChatAction): ChatState {
  switch (action.type) {
    case "conversation/create": {
      const conversation = createConversation(action.input);
      return upsertConversation(state, conversation, true);
    }

    case "conversation/set-active":
      return {
        ...state,
        activeConversationId: action.conversationId
      };

    case "conversation/delete":
      return deleteConversation(state, action.conversationId);

    case "conversation/update":
      return updateConversation(state, action.input.id, (conversation) => ({
        ...conversation,
        metadata: action.input.metadata ?? conversation.metadata,
        title: action.input.title ?? conversation.title,
        updatedAt: nowIso()
      }));

    case "message/add": {
      const message = createMessage(action.input);
      return upsertMessage(state, message);
    }

    case "message/delete":
      return deleteMessage(state, action.messageId);

    case "message/update":
      return updateMessage(state, action.input.id, (message) => ({
        ...message,
        content: action.input.content ?? message.content,
        metadata: action.input.metadata ?? message.metadata,
        status: action.input.status ?? message.status,
        updatedAt: action.input.updatedAt ?? nowIso()
      }));

    case "request/start":
      return updateConversation(state, action.conversationId, (conversation) => ({
        ...conversation,
        activeRequestId: action.requestId,
        updatedAt: nowIso()
      }));

    case "request/finish":
      return updateConversation(state, action.conversationId, (conversation) => ({
        ...conversation,
        activeRequestId:
          conversation.activeRequestId === action.requestId ? undefined : conversation.activeRequestId,
        updatedAt: nowIso()
      }));

    case "stream/apply":
      return applyStreamEvent(state, action.event);

    default:
      return state;
  }
}

export function applyStreamEvent(state: ChatState, event: StreamEvent): ChatState {
  switch (event.type) {
    case "message_start": {
      const now = event.createdAt ?? nowIso();
      const message: ChatMessage = {
        id: event.messageId,
        conversationId: event.conversationId,
        role: event.role,
        content: "",
        status: "streaming",
        createdAt: now,
        updatedAt: now,
        requestId: event.requestId,
        toolCalls: [],
        attachments: [],
        metadata: event.metadata
      };

      return upsertMessage(state, message);
    }

    case "token":
      return updateMessage(state, event.messageId, (message) => ({
        ...message,
        content: `${message.content}${event.delta}`,
        status: "streaming",
        updatedAt: event.updatedAt ?? nowIso()
      }));

    case "tool_call":
      return updateMessage(state, event.messageId, (message) => ({
        ...message,
        toolCalls: upsertToolCall(message.toolCalls, {
          ...event.toolCall,
          status: event.toolCall.status ?? "pending"
        }),
        updatedAt: event.updatedAt ?? nowIso()
      }));

    case "tool_result":
      return updateMessage(state, event.messageId, (message) => ({
        ...message,
        toolCalls: message.toolCalls.map((toolCall) =>
          toolCall.id === event.toolCallId
            ? {
                ...toolCall,
                status: event.error ? "failed" : "done",
                result: event.result,
                error: event.error,
                completedAt: event.updatedAt ?? nowIso()
              }
            : toolCall
        ),
        updatedAt: event.updatedAt ?? nowIso()
      }));

    case "message_done":
      return updateMessage(state, event.messageId, (message) => ({
        ...message,
        status: "complete",
        finishReason: event.finishReason ?? "stop",
        updatedAt: event.updatedAt ?? nowIso()
      }));

    case "message_error":
      return updateMessage(state, event.messageId, (message) => ({
        ...message,
        status: "failed",
        error: event.error,
        finishReason: "error",
        updatedAt: event.updatedAt ?? nowIso()
      }));

    case "request_cancelled":
      return {
        ...markConversationRequestDone(state, event.conversationId, event.requestId),
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([id, message]) => [
            id,
            message.conversationId === event.conversationId &&
            message.requestId === event.requestId &&
            message.status === "streaming"
              ? {
                  ...message,
                  status: "cancelled",
                  finishReason: "cancelled",
                  updatedAt: event.updatedAt ?? nowIso()
                }
              : message
          ])
        )
      };
  }
}

function deleteConversation(state: ChatState, conversationId: Conversation["id"]): ChatState {
  const conversation = state.conversations[conversationId];
  if (conversation === undefined) {
    return state;
  }

  const conversations = { ...state.conversations };
  delete conversations[conversationId];

  const messages = { ...state.messages };
  conversation.messageIds.forEach((messageId) => {
    delete messages[messageId];
  });

  const requestIdsByConversation = { ...state.requestIdsByConversation };
  delete requestIdsByConversation[conversationId];

  const nextActiveConversationId =
    state.activeConversationId === conversationId
      ? Object.values(conversations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id
      : state.activeConversationId;

  return {
    ...state,
    activeConversationId: nextActiveConversationId,
    conversations,
    messages,
    requestIdsByConversation
  };
}

function upsertConversation(
  state: ChatState,
  conversation: Conversation,
  setActive = false
): ChatState {
  return {
    ...state,
    conversations: {
      ...state.conversations,
      [conversation.id]: conversation
    },
    activeConversationId: setActive ? conversation.id : state.activeConversationId
  };
}

function upsertMessage(state: ChatState, message: ChatMessage): ChatState {
  const conversation = state.conversations[message.conversationId];
  const nextConversation =
    conversation === undefined
      ? createConversation({
          id: message.conversationId,
          title: "New conversation",
          now: message.createdAt
        })
      : conversation;

  const hasMessage = nextConversation.messageIds.includes(message.id);
  const updatedConversation: Conversation = {
    ...nextConversation,
    messageIds: hasMessage ? nextConversation.messageIds : [...nextConversation.messageIds, message.id],
    updatedAt: message.updatedAt
  };

  return {
    ...state,
    conversations: {
      ...state.conversations,
      [updatedConversation.id]: updatedConversation
    },
    messages: {
      ...state.messages,
      [message.id]: message
    },
    activeConversationId: state.activeConversationId ?? updatedConversation.id
  };
}

function deleteMessage(state: ChatState, messageId: MessageId): ChatState {
  const message = state.messages[messageId];
  if (message === undefined) {
    return state;
  }

  const messages = { ...state.messages };
  delete messages[messageId];

  const conversation = state.conversations[message.conversationId];
  return {
    ...state,
    conversations:
      conversation === undefined
        ? state.conversations
        : {
            ...state.conversations,
            [conversation.id]: {
              ...conversation,
              messageIds: conversation.messageIds.filter((id) => id !== messageId),
              updatedAt: nowIso()
            }
          },
    messages
  };
}

function updateConversation(
  state: ChatState,
  conversationId: Conversation["id"],
  updater: (conversation: Conversation) => Conversation
): ChatState {
  const conversation = state.conversations[conversationId];
  if (conversation === undefined) {
    return state;
  }

  return {
    ...state,
    conversations: {
      ...state.conversations,
      [conversationId]: updater(conversation)
    }
  };
}

function updateMessage(
  state: ChatState,
  messageId: MessageId,
  updater: (message: ChatMessage) => ChatMessage
): ChatState {
  const message = state.messages[messageId];
  if (message === undefined) {
    return state;
  }

  const nextMessage = updater(message);
  const conversation = state.conversations[nextMessage.conversationId];

  return {
    ...state,
    conversations:
      conversation === undefined
        ? state.conversations
        : {
            ...state.conversations,
            [conversation.id]: {
              ...conversation,
              updatedAt: nextMessage.updatedAt
            }
          },
    messages: {
      ...state.messages,
      [messageId]: nextMessage
    }
  };
}

function upsertToolCall(toolCalls: readonly ToolCall[], incoming: ToolCall): readonly ToolCall[] {
  const existing = toolCalls.find((toolCall) => toolCall.id === incoming.id);
  if (existing === undefined) {
    return [...toolCalls, incoming];
  }

  return toolCalls.map((toolCall) =>
    toolCall.id === incoming.id
      ? {
          ...toolCall,
          ...incoming
        }
      : toolCall
  );
}

function markConversationRequestDone(
  state: ChatState,
  conversationId: Conversation["id"],
  requestId: NonNullable<Conversation["activeRequestId"]>
): ChatState {
  return updateConversation(state, conversationId, (conversation) => ({
    ...conversation,
    activeRequestId: conversation.activeRequestId === requestId ? undefined : conversation.activeRequestId,
    updatedAt: nowIso()
  }));
}
