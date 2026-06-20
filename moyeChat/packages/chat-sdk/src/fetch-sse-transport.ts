import { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";
import type { StreamEvent } from "@agent-chat/chat-core";
import { isAbortError } from "@agent-chat/utils";

import { decodeJsonStreamEvent } from "./decoders";
import type {
  ChatRequestPayload,
  ChatTransport,
  FetchSseTransportOptions,
  StreamConnectionStatus,
  StreamEventHandlers,
  StreamRetryPolicy,
  StreamSubscription
} from "./types";

const DEFAULT_RETRY_POLICY: StreamRetryPolicy = {
  baseDelayMs: 500,
  jitterRatio: 0.25,
  maxAttempts: 5,
  maxDelayMs: 8_000
};

const DEFAULT_IDLE_TIMEOUT_MS = 45_000;

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
    let controller = new AbortController();
    const requestId = payload.requestId;
    const decode = this.options.decodeEvent ?? decodeJsonStreamEvent;
    const retryPolicy = resolveRetryPolicy(this.options.retry);
    const idleTimeoutMs = this.options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    let attempt = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let idleRetryRequested = false;
    let lastEventId: string | undefined;
    let terminalEventReceived = false;
    let userCancelled = false;
    this.controllers.set(requestId, controller);

    const emitStatus = (status: Omit<StreamConnectionStatus, "requestId" | "attempt" | "lastEventId">) => {
      handlers.onStatusChange?.({
        requestId,
        attempt,
        lastEventId,
        ...status
      });
    };

    const clearIdleTimer = () => {
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
        idleTimer = undefined;
      }
    };

    const armIdleTimer = () => {
      clearIdleTimer();
      if (idleTimeoutMs <= 0 || terminalEventReceived || userCancelled) {
        return;
      }

      idleTimer = setTimeout(() => {
        idleRetryRequested = true;
        controller.abort(new StreamIdleTimeoutError(idleTimeoutMs));
      }, idleTimeoutMs);
    };

    const run = () => {
      controller = new AbortController();
      this.controllers.set(requestId, controller);
      idleRetryRequested = false;
      emitStatus({ phase: attempt === 0 ? "connecting" : "retrying" });
      armIdleTimer();

      void fetchEventSource(String(this.options.endpoint), {
        method: this.options.method ?? "POST",
        credentials: this.options.credentials,
        headers: resolveHeaders(this.options.headers, payload, lastEventId),
        body: this.options.body?.(payload) ?? JSON.stringify(payload),
        fetch: this.options.fetch,
        signal: controller.signal,
        async onopen(response) {
          validateEventStreamResponse(response);
          emitStatus({ phase: "open" });
          handlers.onOpen?.();
          armIdleTimer();
        },
        onmessage(message) {
          if (message.id.length > 0) {
            lastEventId = message.id;
          }

          armIdleTimer();
          const decoded = decode(message.data, message.event);
          if (decoded === undefined) {
            return;
          }

          const events = Array.isArray(decoded) ? decoded : [decoded];
          terminalEventReceived = events.some(isTerminalEvent) || terminalEventReceived;
          for (const event of events) {
            handlers.onEvent(event);
          }
        },
        onclose: () => {
          clearIdleTimer();
          if (terminalEventReceived || retryPolicy === false || userCancelled) {
            this.controllers.delete(requestId);
            emitStatus({ phase: "closed" });
            handlers.onClose?.();
            return;
          }

          throw new RetryableStreamError("Stream closed before a terminal event was received.");
        },
        onerror: (error) => {
          clearIdleTimer();
          if (isAbortError(error) && !idleRetryRequested) {
            return;
          }

          const normalized = normalizeError(error);
          if (retryPolicy === false || !isRetryableError(normalized) || attempt >= retryPolicy.maxAttempts) {
            this.controllers.delete(requestId);
            emitStatus({ phase: "closed", error: normalized });
            throw normalized;
          }

          attempt += 1;
          const delayMs = resolveRetryDelay(retryPolicy, attempt, normalized);
          const context = {
            requestId,
            attempt,
            maxAttempts: retryPolicy.maxAttempts,
            delayMs,
            error: normalized,
            lastEventId
          };

          emitStatus({ phase: "retrying", error: normalized, nextRetryDelayMs: delayMs });
          handlers.onRetry?.(context);
          return delayMs;
        },
        openWhenHidden: true
      }).then(() => {
        clearIdleTimer();
        if (idleRetryRequested && !userCancelled && !terminalEventReceived) {
          const normalized = new StreamIdleTimeoutError(idleTimeoutMs);
          if (retryPolicy === false || attempt >= retryPolicy.maxAttempts) {
            this.controllers.delete(requestId);
            emitStatus({ phase: "closed", error: normalized });
            handlers.onError?.(normalized);
            return;
          }

          attempt += 1;
          const delayMs = resolveRetryDelay(retryPolicy, attempt, normalized);
          handlers.onRetry?.({
            requestId,
            attempt,
            maxAttempts: retryPolicy.maxAttempts,
            delayMs,
            error: normalized,
            lastEventId
          });
          emitStatus({ phase: "retrying", error: normalized, nextRetryDelayMs: delayMs });
          setTimeout(run, delayMs);
        }
      }).catch((error) => {
        clearIdleTimer();
        const normalized = normalizeError(error);
        this.controllers.delete(requestId);
        emitStatus({ phase: "closed", error: normalized });
        handlers.onError?.(normalized);
      });
    };

    run();

    return {
      requestId,
      cancel: (reason) => {
        userCancelled = true;
        clearIdleTimer();
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
  payload: ChatRequestPayload,
  lastEventId?: string
): Record<string, string> {
  const resolved = typeof headers === "function" ? headers(payload) : headers;
  const normalized: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream"
  };

  if (resolved === undefined) {
    if (lastEventId !== undefined) {
      normalized["Last-Event-ID"] = lastEventId;
    }

    return normalized;
  }

  new Headers(resolved).forEach((value, key) => {
    normalized[key] = value;
  });

  if (lastEventId !== undefined) {
    normalized["Last-Event-ID"] = lastEventId;
  }

  return normalized;
}

function resolveRetryPolicy(retry: FetchSseTransportOptions["retry"]): StreamRetryPolicy | false {
  if (retry === false) {
    return false;
  }

  return {
    ...DEFAULT_RETRY_POLICY,
    ...retry
  };
}

function validateEventStreamResponse(response: Response): void {
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const message = `Stream request failed with HTTP ${response.status}.`;
    if (isRetryableStatus(response.status)) {
      throw new RetryableHttpError(message, response.status, resolveRetryAfterMs(response.headers));
    }

    throw new FatalHttpError(message, response.status);
  }

  if (contentType?.startsWith(EventStreamContentType) !== true) {
    throw new FatalStreamError(`Expected content-type ${EventStreamContentType}, received ${contentType ?? "unknown"}.`);
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function isRetryableError(error: Error): boolean {
  return (
    error instanceof RetryableHttpError ||
    error instanceof RetryableStreamError ||
    error instanceof StreamIdleTimeoutError ||
    error.name === "TypeError"
  );
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function resolveRetryDelay(policy: StreamRetryPolicy, attempt: number, error: Error): number {
  if (error instanceof RetryableHttpError && error.retryAfterMs !== undefined) {
    return clamp(error.retryAfterMs, 0, policy.maxDelayMs);
  }

  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitter = exponential * policy.jitterRatio * Math.random();
  return Math.round(clamp(exponential + jitter, 0, policy.maxDelayMs));
}

function resolveRetryAfterMs(headers: Headers): number | undefined {
  const retryAfter = headers.get("retry-after");
  if (retryAfter === null) {
    return undefined;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1_000);
  }

  const retryAt = Date.parse(retryAfter);
  return Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTerminalEvent(event: StreamEvent): boolean {
  return event.type === "message_done" || event.type === "message_error" || event.type === "request_cancelled";
}

class FatalStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalStreamError";
  }
}

class RetryableStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableStreamError";
  }
}

class StreamIdleTimeoutError extends RetryableStreamError {
  constructor(timeoutMs: number) {
    super(`Stream received no events for ${timeoutMs}ms.`);
    this.name = "StreamIdleTimeoutError";
  }
}

class FatalHttpError extends FatalStreamError {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FatalHttpError";
    this.status = status;
  }
}

class RetryableHttpError extends RetryableStreamError {
  readonly retryAfterMs?: number;
  readonly status: number;

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "RetryableHttpError";
    this.retryAfterMs = retryAfterMs;
    this.status = status;
  }
}
