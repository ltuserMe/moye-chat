import type { StreamEvent } from "@agent-chat/chat-core";

import type { EventDecoder } from "./types";

export const decodeJsonStreamEvent: EventDecoder = (raw, eventName) => {
  if (raw.trim().length === 0 || raw === "[DONE]") {
    return undefined;
  }

  const parsed = JSON.parse(raw) as Partial<StreamEvent> & { type?: string };
  const type = parsed.type ?? eventName;

  if (type === undefined) {
    return undefined;
  }

  return {
    ...parsed,
    type
  } as StreamEvent;
};
