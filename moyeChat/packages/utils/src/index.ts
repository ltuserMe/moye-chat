import type { EntityId, ISODateTime } from "@agent-chat/types";

export function nowIso(): ISODateTime {
  return new Date().toISOString() as ISODateTime;
}

export function createId(prefix = "id"): EntityId {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}` as EntityId;
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
