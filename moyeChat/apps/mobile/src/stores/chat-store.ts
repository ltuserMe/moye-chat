import {
  chatReducer,
  createConversation as createCoreConversation,
  createMessage,
  selectConversationMessages,
  type ChatMessage,
  type ChatState,
  type ConversationId,
  type RequestId
} from '@agent-chat/chat-core';
import type { StreamSubscription } from '@agent-chat/chat-sdk';
import { createId } from '@agent-chat/utils';
import { create } from 'zustand';

import { createConfiguredChatSdk } from '@/lib/chatSdk';

interface ChatStore {
  core: ChatState;
  activeConversationId?: ConversationId;
  activeMessages: readonly ChatMessage[];
  inputValue: string;
  isSending: boolean;
  activeRequestId?: RequestId;
  activeSubscription?: StreamSubscription;
  setInputValue(value: string): void;
  send(): void;
  cancel(): void;
}

const initialConversation = createCoreConversation({ title: 'Mobile conversation' });
const initialCore = chatReducer(undefined, {
  type: 'conversation/create',
  input: initialConversation
});

export const useChatStore = create<ChatStore>((set, get) => ({
  core: initialCore,
  activeConversationId: initialCore.activeConversationId,
  activeMessages:
    initialCore.activeConversationId === undefined
      ? []
      : selectConversationMessages(initialCore, initialCore.activeConversationId),
  inputValue: '',
  isSending: false,

  setInputValue(value) {
    set({ inputValue: value });
  },

  send() {
    const state = get();
    const conversationId = state.activeConversationId;
    const content = state.inputValue.trim();

    if (conversationId === undefined || content.length === 0 || state.isSending) {
      return;
    }

    const userMessage = createMessage({
      conversationId,
      role: 'user',
      content,
      status: 'complete'
    });

    let nextCore = chatReducer(state.core, {
      type: 'message/add',
      input: userMessage
    });
    set(deriveState(nextCore, { inputValue: '', isSending: true }));

    try {
      const sdk = createConfiguredChatSdk();
      const subscription = sdk.sendMessage(
        {
          conversationId,
          content,
          history: selectConversationMessages(nextCore, conversationId)
        },
        {
          onEvent(event) {
            const updatedCore = chatReducer(get().core, {
              type: 'stream/apply',
              event
            });
            set(deriveState(updatedCore));
          },
          onError(error) {
            appendFrontendError(set, get(), conversationId, error.message);
          },
          onClose() {
            set({ isSending: false, activeRequestId: undefined, activeSubscription: undefined });
          }
        }
      );

      nextCore = chatReducer(get().core, {
        type: 'request/start',
        conversationId,
        requestId: subscription.requestId
      });
      set(deriveState(nextCore, { activeRequestId: subscription.requestId, activeSubscription: subscription }));
    } catch (error) {
      appendFrontendError(set, get(), conversationId, error instanceof Error ? error.message : String(error));
    }
  },

  cancel() {
    const state = get();
    if (state.activeConversationId === undefined || state.activeRequestId === undefined) {
      return;
    }

    state.activeSubscription?.cancel('User cancelled request.');
    const nextCore = chatReducer(state.core, {
      type: 'stream/apply',
      event: {
        type: 'request_cancelled',
        conversationId: state.activeConversationId,
        requestId: state.activeRequestId
      }
    });
    set(deriveState(nextCore, { activeRequestId: undefined, activeSubscription: undefined, isSending: false }));
  }
}));

function deriveState(core: ChatState, extra: Partial<ChatStore> = {}): Partial<ChatStore> {
  const activeConversationId = core.activeConversationId;

  return {
    core,
    activeConversationId,
    activeMessages:
      activeConversationId === undefined ? [] : selectConversationMessages(core, activeConversationId),
    ...extra
  };
}

function appendFrontendError(
  set: (partial: Partial<ChatStore>) => void,
  state: ChatStore,
  conversationId: ConversationId,
  message: string
): void {
  const errorMessage = createMessage({
    id: createId('msg'),
    conversationId,
    role: 'system',
    content: message,
    status: 'failed'
  });
  const nextCore = chatReducer(state.core, {
    type: 'message/add',
    input: errorMessage
  });

  set(
    deriveState(nextCore, {
      activeRequestId: undefined,
      activeSubscription: undefined,
      isSending: false
    })
  );
}
