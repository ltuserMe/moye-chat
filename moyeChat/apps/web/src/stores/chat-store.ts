"use client";

import {
  chatReducer,
  createConversation as createCoreConversation,
  createMessage,
  selectConversationMessages,
  selectConversations,
  type ChatAction,
  type ChatMessage,
  type ChatState,
  type ConversationId,
  type RequestId
} from "@agent-chat/chat-core";
import { createId } from "@agent-chat/utils";
import { create } from "zustand";

import {
  startMockAssistantStream,
  type MockStreamController
} from "@/lib/chat/mock-stream";

interface ActiveStream {
  requestId: RequestId;
  controller: MockStreamController;
}

interface ChatStore {
  core: ChatState;
  conversations: ReturnType<typeof selectConversations>;
  activeConversationId?: ConversationId;
  activeMessages: readonly ChatMessage[];
  inputValue: string;
  isSending: boolean;
  streamsByConversation: Partial<Record<ConversationId, ActiveStream>>;
  setInputValue(value: string): void;
  createConversation(): void;
  selectConversation(conversationId: ConversationId): void;
  send(): void;
  cancel(): void;
}

const seededCore = createSeededCore();

export const useChatStore = create<ChatStore>((set, get) => ({
  core: seededCore,
  conversations: selectConversations(seededCore),
  activeConversationId: seededCore.activeConversationId,
  activeMessages:
    seededCore.activeConversationId === undefined
      ? []
      : selectConversationMessages(seededCore, seededCore.activeConversationId),
  inputValue: "",
  isSending: false,
  streamsByConversation: {},

  setInputValue(value) {
    set({ inputValue: value });
  },

  createConversation() {
    const conversation = createCoreConversation({ title: "New chat" });
    commitCore(set, get(), {
      type: "conversation/create",
      input: conversation
    });
  },

  selectConversation(conversationId) {
    commitCore(set, get(), {
      type: "conversation/set-active",
      conversationId
    });
  },

  send() {
    const state = get();
    const conversationId = state.activeConversationId;
    const content = state.inputValue.trim();

    if (conversationId === undefined || content.length === 0 || state.streamsByConversation[conversationId]) {
      return;
    }

    const requestId = createId("req") as RequestId;
    const userMessage = createMessage({
      conversationId,
      role: "user",
      content,
      status: "complete"
    });

    let nextCore = chatReducer(state.core, {
      type: "message/add",
      input: userMessage
    });
    nextCore = chatReducer(nextCore, {
      type: "request/start",
      conversationId,
      requestId
    });

    set(
      deriveState(nextCore, {
        inputValue: ""
      })
    );

    const controller = startMockAssistantStream({
      conversationId,
      requestId,
      prompt: content,
      onEvent(event) {
        const updatedCore = chatReducer(get().core, {
          type: "stream/apply",
          event
        });
        set(
          deriveState(updatedCore, {
            streamsByConversation: get().streamsByConversation
          })
        );
      },
      onClose() {
        const current = get();
        const finishedCore = chatReducer(current.core, {
          type: "request/finish",
          conversationId,
          requestId
        });
        const nextStreams = { ...current.streamsByConversation };
        delete nextStreams[conversationId];
        set(
          deriveState(finishedCore, {
            streamsByConversation: nextStreams
          })
        );
      }
    });

    set((current) =>
      deriveState(current.core, {
        streamsByConversation: {
          ...current.streamsByConversation,
          [conversationId]: {
            requestId,
            controller
          }
        }
      })
    );
  },

  cancel() {
    const state = get();
    const conversationId = state.activeConversationId;
    if (conversationId === undefined) {
      return;
    }

    const stream = state.streamsByConversation[conversationId];
    if (stream === undefined) {
      return;
    }

    stream.controller.cancel("User cancelled request.");

    const current = get();
    const cancelledCore = chatReducer(current.core, {
      type: "stream/apply",
      event: {
        type: "request_cancelled",
        conversationId,
        requestId: stream.requestId
      }
    });
    const nextStreams = { ...current.streamsByConversation };
    delete nextStreams[conversationId];

    set(
      deriveState(cancelledCore, {
        streamsByConversation: nextStreams
      })
    );
  }
}));

function commitCore(
  set: (partial: Partial<ChatStore>) => void,
  state: ChatStore,
  action: ChatAction
): void {
  set(deriveState(chatReducer(state.core, action), { streamsByConversation: state.streamsByConversation }));
}

function deriveState(core: ChatState, extra: Partial<ChatStore> = {}): Partial<ChatStore> {
  const activeConversationId = core.activeConversationId;
  const streamsByConversation = extra.streamsByConversation;
  const isSending =
    activeConversationId === undefined ? false : streamsByConversation?.[activeConversationId] !== undefined;

  return {
    core,
    activeConversationId,
    activeMessages:
      activeConversationId === undefined ? [] : selectConversationMessages(core, activeConversationId),
    conversations: selectConversations(core),
    isSending,
    ...extra
  };
}

function createSeededCore(): ChatState {
  const planningConversation = createCoreConversation({ title: "Agent planning" });
  const codingConversation = createCoreConversation({ title: "Frontend implementation" });
  const reviewConversation = createCoreConversation({ title: "Tool call review" });

  let core = chatReducer(undefined, {
    type: "conversation/create",
    input: planningConversation
  });
  core = chatReducer(core, {
    type: "conversation/create",
    input: codingConversation
  });
  core = chatReducer(core, {
    type: "conversation/create",
    input: reviewConversation
  });
  core = chatReducer(core, {
    type: "conversation/set-active",
    conversationId: planningConversation.id
  });

  const seedMessages = [
    createMessage({
      conversationId: planningConversation.id,
      role: "system",
      content: "Frontend mock mode is enabled. Messages stream locally without a backend.",
      status: "complete"
    }),
    createMessage({
      conversationId: planningConversation.id,
      role: "assistant",
      content: "Ask me anything. I will stream the response token by token and show simulated tool activity.",
      status: "complete"
    }),
    createMessage({
      conversationId: codingConversation.id,
      role: "assistant",
      content: "This conversation is ready for implementation questions.",
      status: "complete"
    }),
    createMessage({
      conversationId: reviewConversation.id,
      role: "assistant",
      content: "Tool call visualization will appear in both the message body and the right-side panel.",
      status: "complete"
    })
  ];

  return seedMessages.reduce(
    (nextCore, message) =>
      chatReducer(nextCore, {
        type: "message/add",
        input: message
      }),
    core
  );
}
