import type {
  ChatAttachment,
  ChatMessage,
  ConversationId,
  RequestId,
  StreamEvent
} from "@agent-chat/chat-core";
import type { JsonObject, JsonValue } from "@agent-chat/types";

export interface SendMessageInput {
  conversationId: ConversationId;
  content: string;
  attachments?: readonly ChatAttachment[];
  history?: readonly ChatMessage[];
  metadata?: JsonObject;
}

export interface ChatRequestPayload {
  conversationId: ConversationId;
  requestId: RequestId;
  content: string;
  attachments: readonly ChatAttachment[];
  history: readonly ChatMessage[];
  metadata?: JsonObject;
}

export interface StreamEventHandlers {
  onEvent(event: StreamEvent): void;
  onError?(error: Error): void;
  onOpen?(): void;
  onClose?(): void;
}

export interface StreamSubscription {
  requestId: RequestId;
  cancel(reason?: string): void;
}

export interface ChatTransport {
  subscribeToStreamEvents(payload: ChatRequestPayload, handlers: StreamEventHandlers): StreamSubscription;
}

export interface ChatSdk {
  sendMessage(input: SendMessageInput, handlers: StreamEventHandlers): StreamSubscription;
  subscribeToStreamEvents(payload: ChatRequestPayload, handlers: StreamEventHandlers): StreamSubscription;
  cancelRequest(requestId: RequestId, reason?: string): void;
}

export type EventDecoder = (raw: string, eventName?: string) => StreamEvent | StreamEvent[] | undefined;

export interface FetchSseTransportOptions {
  endpoint: string | URL;
  method?: "POST" | "PUT";
  headers?: HeadersInit | ((payload: ChatRequestPayload) => HeadersInit);
  credentials?: RequestCredentials;
  body?: (payload: ChatRequestPayload) => BodyInit;
  decodeEvent?: EventDecoder;
  fetch?: typeof fetch;
}

export interface StreamEnvelope {
  type: StreamEvent["type"];
  payload?: JsonValue;
}
