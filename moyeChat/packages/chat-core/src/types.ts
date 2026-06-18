import type { EntityId, ISODateTime, JsonObject, JsonValue } from "@agent-chat/types";

export type ConversationId = EntityId;
export type MessageId = EntityId;
export type RequestId = EntityId;
export type ToolCallId = EntityId;

export type ChatRole = "user" | "assistant" | "tool" | "system";
export type MessageStatus = "queued" | "streaming" | "complete" | "failed" | "cancelled";
export type ToolCallStatus = "pending" | "running" | "done" | "failed";
export type FinishReason = "stop" | "length" | "tool_calls" | "cancelled" | "error" | "unknown";

export interface ChatAttachment {
  id: EntityId;
  name: string;
  mimeType: string;
  size?: number;
  url?: string;
  metadata?: JsonObject;
}

export interface ToolCall {
  id: ToolCallId;
  name: string;
  status: ToolCallStatus;
  argumentsText?: string;
  result?: JsonValue;
  error?: string;
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
}

export interface ChatMessage {
  id: MessageId;
  conversationId: ConversationId;
  role: ChatRole;
  content: string;
  status: MessageStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  requestId?: RequestId;
  toolCallId?: ToolCallId;
  toolCalls: readonly ToolCall[];
  attachments: readonly ChatAttachment[];
  metadata?: JsonObject;
  finishReason?: FinishReason;
  error?: string;
}

export interface Conversation {
  id: ConversationId;
  title: string;
  messageIds: readonly MessageId[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  activeRequestId?: RequestId;
  metadata?: JsonObject;
}

export interface ChatState {
  conversations: Record<ConversationId, Conversation>;
  messages: Record<MessageId, ChatMessage>;
  activeConversationId?: ConversationId;
  requestIdsByConversation: Record<ConversationId, RequestId | undefined>;
}

export interface CreateConversationInput {
  id?: ConversationId;
  title?: string;
  metadata?: JsonObject;
  now?: ISODateTime;
}

export interface UpdateConversationInput {
  id: ConversationId;
  title?: string;
  metadata?: JsonObject;
}

export interface UpdateMessageInput {
  id: MessageId;
  content?: string;
  status?: MessageStatus;
  metadata?: JsonObject;
  updatedAt?: ISODateTime;
}

export interface CreateMessageInput {
  id?: MessageId;
  conversationId: ConversationId;
  role: ChatRole;
  content: string;
  status?: MessageStatus;
  attachments?: readonly ChatAttachment[];
  metadata?: JsonObject;
  requestId?: RequestId;
  now?: ISODateTime;
}

export type StreamEvent =
  | {
      type: "message_start";
      conversationId: ConversationId;
      messageId: MessageId;
      role: Extract<ChatRole, "assistant" | "tool" | "system">;
      requestId?: RequestId;
      createdAt?: ISODateTime;
      metadata?: JsonObject;
    }
  | {
      type: "token";
      messageId: MessageId;
      delta: string;
      updatedAt?: ISODateTime;
    }
  | {
      type: "tool_call";
      messageId: MessageId;
      toolCall: ToolCall;
      updatedAt?: ISODateTime;
    }
  | {
      type: "tool_result";
      messageId: MessageId;
      toolCallId: ToolCallId;
      result?: JsonValue;
      error?: string;
      updatedAt?: ISODateTime;
    }
  | {
      type: "message_done";
      messageId: MessageId;
      finishReason?: FinishReason;
      updatedAt?: ISODateTime;
    }
  | {
      type: "message_error";
      messageId: MessageId;
      error: string;
      updatedAt?: ISODateTime;
    }
  | {
      type: "request_cancelled";
      conversationId: ConversationId;
      requestId: RequestId;
      updatedAt?: ISODateTime;
    };

export type ChatAction =
  | { type: "conversation/create"; input: CreateConversationInput }
  | { type: "conversation/delete"; conversationId: ConversationId }
  | { type: "conversation/update"; input: UpdateConversationInput }
  | { type: "conversation/set-active"; conversationId: ConversationId }
  | { type: "message/add"; input: CreateMessageInput }
  | { type: "message/delete"; messageId: MessageId }
  | { type: "message/update"; input: UpdateMessageInput }
  | { type: "stream/apply"; event: StreamEvent }
  | { type: "request/start"; conversationId: ConversationId; requestId: RequestId }
  | { type: "request/finish"; conversationId: ConversationId; requestId: RequestId };
