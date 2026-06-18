import { fetchEventSource } from "@microsoft/fetch-event-source";
import { isAbortError } from "@agent-chat/utils";

import { decodeJsonStreamEvent } from "./decoders";
import type {
  ChatRequestPayload,
  ChatTransport,
  FetchSseTransportOptions,
  StreamEventHandlers,
  StreamSubscription
} from "./types";

export class FetchSseTransport implements ChatTransport {
  private readonly options: FetchSseTransportOptions;
  private readonly controllers = new Map<string, AbortController>();

  constructor(options: FetchSseTransportOptions) {
    this.options = options;
  }

  subscribeToStreamEvents(
    payload: ChatRequestPayload,
    handlers: StreamEventHandlers
  ): StreamSubscription {
    const controller = new AbortController();
    const requestId = payload.requestId;
    const decode = this.options.decodeEvent ?? decodeJsonStreamEvent;
    this.controllers.set(requestId, controller);

    void fetchEventSource(String(this.options.endpoint), {
      method: this.options.method ?? "POST",
      credentials: this.options.credentials,
      headers: resolveHeaders(this.options.headers, payload),
      body: this.options.body?.(payload) ?? JSON.stringify(payload),
      fetch: this.options.fetch,
      signal: controller.signal,
      async onopen() {
        handlers.onOpen?.();
      },
      onmessage(message) {
        const decoded = decode(message.data, message.event);
        if (decoded === undefined) {
          return;
        }

        const events = Array.isArray(decoded) ? decoded : [decoded];
        for (const event of events) {
          handlers.onEvent(event);
        }
      },
      onclose: () => {
        this.controllers.delete(requestId);
        handlers.onClose?.();
      },
      onerror: (error) => {
        if (isAbortError(error)) {
          return;
        }

        const normalized = error instanceof Error ? error : new Error(String(error));
        handlers.onError?.(normalized);
        throw normalized;
      },
      openWhenHidden: true
    });

    return {
      requestId,
      cancel: (reason) => {
        controller.abort(reason);
        this.controllers.delete(requestId);
      }
    };
  }

  cancelRequest(requestId: string, reason?: string): void {
    const controller = this.controllers.get(requestId);
    controller?.abort(reason);
    this.controllers.delete(requestId);
  }
}

function resolveHeaders(
  headers: FetchSseTransportOptions["headers"],
  payload: ChatRequestPayload
): Record<string, string> {
  const resolved = typeof headers === "function" ? headers(payload) : headers;
  const normalized: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream"
  };

  if (resolved === undefined) {
    return normalized;
  }

  new Headers(resolved).forEach((value, key) => {
    normalized[key] = value;
  });

  return normalized;
}
