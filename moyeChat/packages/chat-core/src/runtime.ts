import type { Disposable } from "@agent-chat/types";

import { createInitialChatState } from "./factory";
import { chatReducer } from "./reducer";
import type { ChatAction, ChatState } from "./types";

export type ChatStateListener = (state: ChatState, action: ChatAction) => void;

export interface ChatRuntime {
  dispatch(action: ChatAction): void;
  getState(): ChatState;
  subscribe(listener: ChatStateListener): Disposable;
}

export function createChatRuntime(initialState: ChatState = createInitialChatState()): ChatRuntime {
  let state = initialState;
  const listeners = new Set<ChatStateListener>();

  return {
    dispatch(action) {
      state = chatReducer(state, action);
      for (const listener of listeners) {
        listener(state, action);
      }
    },
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return {
        dispose() {
          listeners.delete(listener);
        }
      };
    }
  };
}
