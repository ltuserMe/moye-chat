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
  onRetry?(context: StreamRetryContext): void;
  onStatusChange?(status: StreamConnectionStatus): void;
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

export type StreamConnectionPhase = "connecting" | "open" | "retrying" | "closed";

export interface StreamConnectionStatus {
  phase: StreamConnectionPhase;
  requestId: RequestId;
  attempt: number;
  lastEventId?: string;
  error?: Error;
  nextRetryDelayMs?: number;
}

export interface StreamRetryContext {
  requestId: RequestId;
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  error: Error;
  lastEventId?: string;
}

export interface StreamRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export interface FetchSseTransportOptions {
  endpoint: string | URL;
  method?: "POST" | "PUT";
  headers?: HeadersInit | ((payload: ChatRequestPayload) => HeadersInit);
  credentials?: RequestCredentials;
  body?: (payload: ChatRequestPayload) => BodyInit;
  decodeEvent?: EventDecoder;
  fetch?: typeof fetch;
  idleTimeoutMs?: number;
  retry?: false | Partial<StreamRetryPolicy>;
}

export interface StreamEnvelope {
  type: StreamEvent["type"];
  payload?: JsonValue;
}
