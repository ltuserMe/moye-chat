import {
  chatReducer,
  createConversation as createCoreConversation,
  selectConversationMessages,
  selectConversations,
  type ChatAction,
  type ChatState,
  type ConversationId,
  type RequestId,
  type StreamEvent
} from '@agent-chat/chat-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StreamSubscription } from '@agent-chat/chat-sdk';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ChatStore {
  activeConversationId?: ConversationId;
  activeRequestId?: RequestId;
  activeSubscription?: StreamSubscription;
  core: ChatState;
  isSending: boolean;
  applyAction(action: ChatAction): void;
  applyStreamEvent(event: StreamEvent): void;
  setActiveSubscription(subscription?: StreamSubscription, requestId?: RequestId): void;
  setSending(isSending: boolean): void;
  syncCore(core: ChatState): void;
}

const initialConversation = createCoreConversation({ title: '数据审查 Agent' });
const initialCore = chatReducer(undefined, {
  input: initialConversation,
  type: 'conversation/create'
});

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      activeConversationId: initialCore.activeConversationId,
      core: initialCore,
      isSending: false,

      applyAction(action) {
        const nextCore = chatReducer(get().core, action);
        set(deriveChatState(nextCore));
      },

      applyStreamEvent(event) {
        const nextCore = chatReducer(get().core, {
          event,
          type: 'stream/apply'
        });
        set(deriveChatState(nextCore));
      },

      setActiveSubscription(subscription, requestId) {
        set({ activeRequestId: requestId, activeSubscription: subscription });
      },

      setSending(isSending) {
        set({ isSending });
      },

      syncCore(core) {
        set(deriveChatState(core));
      }
    }),
    {
      name: 'moye-chat-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        core: state.core,
        activeConversationId: state.activeConversationId
      })
    }
  )
);

export function deriveChatState(core: ChatState): Pick<ChatStore, 'activeConversationId' | 'core'> {
  return {
    activeConversationId: core.activeConversationId,
    core
  };
}

export function getActiveMessages(core: ChatState) {
  return core.activeConversationId === undefined ? [] : selectConversationMessages(core, core.activeConversationId);
}

export function getConversationList(core: ChatState) {
  return selectConversations(core);
}
