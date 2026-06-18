import { createId } from "@agent-chat/utils";

import type {
  ChatRequestPayload,
  ChatSdk,
  ChatTransport,
  SendMessageInput,
  StreamEventHandlers,
  StreamSubscription
} from "./types";

export interface CreateChatSdkOptions {
  transport: ChatTransport;
}

export function createChatSdk(options: CreateChatSdkOptions): ChatSdk {
  const activeSubscriptions = new Map<string, StreamSubscription>();

  return {
    sendMessage(input: SendMessageInput, handlers: StreamEventHandlers) {
      const payload: ChatRequestPayload = {
        conversationId: input.conversationId,
        requestId: createId("req"),
        content: input.content,
        attachments: input.attachments ?? [],
        history: input.history ?? [],
        metadata: input.metadata
      };

      const subscription = options.transport.subscribeToStreamEvents(payload, {
        ...handlers,
        onClose: () => {
          activeSubscriptions.delete(payload.requestId);
          handlers.onClose?.();
        },
        onError: (error) => {
          activeSubscriptions.delete(payload.requestId);
          handlers.onError?.(error);
        }
      });

      activeSubscriptions.set(payload.requestId, subscription);
      return subscription;
    },

    subscribeToStreamEvents(payload: ChatRequestPayload, handlers: StreamEventHandlers) {
      const subscription = options.transport.subscribeToStreamEvents(payload, handlers);
      activeSubscriptions.set(payload.requestId, subscription);
      return subscription;
    },

    cancelRequest(requestId, reason) {
      const subscription = activeSubscriptions.get(requestId);
      subscription?.cancel(reason);
      activeSubscriptions.delete(requestId);
    }
  };
}
