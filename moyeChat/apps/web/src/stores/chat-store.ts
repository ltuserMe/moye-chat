"use client";

import {
  chatReducer,
  createConversation as createCoreConversation,
  createInitialChatState,
  createMessage,
  exportConversationAsJson,
  exportConversationAsMarkdown,
  selectConversationMessages,
  selectConversations,
  type ChatAction,
  type ChatAttachment,
  type ChatMessage,
  type ChatState,
  type Conversation,
  type ConversationId,
  type MessageId,
  type RequestId,
  type ToolCallId
} from "@agent-chat/chat-core";
import type { StreamSubscription } from "@agent-chat/chat-sdk";
import { createId, nowIso } from "@agent-chat/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createConfiguredChatSdk, isSimulationMode } from "@/lib/chatSdk";

interface ConversationView extends Conversation {
  lastMessagePreview?: string;
  lastMessageRole?: ChatMessage["role"];
}

interface ActiveStream {
  requestId: RequestId;
  messageId: MessageId;
  subscription?: StreamSubscription;
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export interface OfflineQueueItem {
  id: string;
  conversationId: ConversationId;
  content: string;
  attachments: readonly ChatAttachment[];
  timestamp: number;
}

interface ChatStore {
  core: ChatState;
  conversations: readonly ConversationView[];
  activeConversationId?: ConversationId;
  activeMessages: readonly ChatMessage[];
  inputValue: string;
  inputAttachments: readonly ChatAttachment[];
  isSending: boolean;
  models: readonly ChatModel[];
  selectedModelId: string;
  streamsByConversation: Partial<Record<ConversationId, ActiveStream>>;
  offlineQueue: readonly OfflineQueueItem[];
  setInputValue(value: string): void;
  setInputAttachments(attachments: readonly ChatAttachment[]): void;
  setSelectedModel(modelId: string): void;
  createConversation(): void;
  selectConversation(conversationId: ConversationId): void;
  deleteConversation(conversationId: ConversationId): void;
  renameConversation(conversationId: ConversationId, title: string): void;
  deleteMessage(messageId: MessageId): void;
  editMessage(messageId: MessageId, content: string): void;
  retryMessage(messageId: MessageId): void;
  send(): void;
  cancel(): void;
  addTag(conversationId: ConversationId, tag: string): void;
  removeTag(conversationId: ConversationId, tag: string): void;
  exportConversation(conversationId: ConversationId, format: "markdown" | "json"): string | null;
  enqueueOffline(item: OfflineQueueItem): void;
  dequeueOffline(id: string): void;
  drainOfflineQueue(): Promise<void>;
}

/** 种子 demo 对话 ID，这些不会被持久化到 localStorage */
const SEED_IDS = new Set<ConversationId>([
  "conv_design_review" as ConversationId,
  "conv_research_brief" as ConversationId,
  "conv_release_plan" as ConversationId
]);

const seededCore = createSeededCore();
const models: readonly ChatModel[] = [
  { id: "gpt-4o", name: "GPT-4o", description: "通用多模态模型" },
  { id: "gpt-4.1", name: "GPT-4.1", description: "复杂推理与代码任务" },
  { id: "agent-pro", name: "Agent Pro", description: "企业工作台默认 Agent" }
];

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
  core: seededCore,
  conversations: selectConversationViews(seededCore),
  activeConversationId: seededCore.activeConversationId,
  activeMessages:
    seededCore.activeConversationId === undefined
      ? []
      : selectConversationMessages(seededCore, seededCore.activeConversationId),
  inputValue: "",
  inputAttachments: [],
  isSending: false,
  models,
  selectedModelId: models[0].id,
  streamsByConversation: {},
  offlineQueue: [],

  setInputValue(value) {
    set({ inputValue: value });
  },

  setInputAttachments(attachments) {
    set({ inputAttachments: attachments });
  },

  setSelectedModel(modelId) {
    if (models.some((model) => model.id === modelId)) {
      set({ selectedModelId: modelId });
    }
  },

  createConversation() {
    const conversation = createCoreConversation({ title: "新对话" });
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

  deleteConversation(conversationId) {
    const state = get();
    const stream = state.streamsByConversation[conversationId];
    stream?.subscription?.cancel("对话已删除");

    const nextStreams = { ...state.streamsByConversation };
    delete nextStreams[conversationId];

    commitCore(set, { ...state, streamsByConversation: nextStreams }, {
      type: "conversation/delete",
      conversationId
    });
  },

  renameConversation(conversationId, title) {
    const normalizedTitle = title.trim();
    if (normalizedTitle.length === 0) {
      return;
    }

    commitCore(set, get(), {
      type: "conversation/update",
      input: { id: conversationId, title: normalizedTitle }
    });
  },

  deleteMessage(messageId) {
    commitCore(set, get(), {
      type: "message/delete",
      messageId
    });
  },

  editMessage(messageId, content) {
    const normalizedContent = content.trim();
    if (normalizedContent.length === 0) {
      return;
    }

    commitCore(set, get(), {
      type: "message/update",
      input: {
        id: messageId,
        content: normalizedContent,
        status: "complete",
        updatedAt: nowIso()
      }
    });
  },

  retryMessage(messageId) {
    const state = get();
    const message = state.core.messages[messageId];
    if (message === undefined || message.role === "user") {
      return;
    }

    const conversationId = message.conversationId;
    if (state.streamsByConversation[conversationId] !== undefined) {
      return;
    }

    const history = selectConversationMessages(state.core, conversationId);
    const messageIndex = history.findIndex((item) => item.id === messageId);
    const previousUserMessage = history
      .slice(0, messageIndex < 0 ? undefined : messageIndex)
      .findLast((item) => item.role === "user");
    const prompt = previousUserMessage?.content ?? "重新生成上一条回复";
    const requestId = createId("req") as RequestId;

    let nextCore = chatReducer(state.core, {
      type: "request/start",
      conversationId,
      requestId
    });
    nextCore = chatReducer(nextCore, {
      type: "stream/apply",
      event: {
        type: "message_start",
        conversationId,
        messageId,
        requestId,
        role: message.role
      }
    });

    set(
      deriveState(nextCore, {
        streamsByConversation: {
          ...state.streamsByConversation,
          [conversationId]: { requestId, messageId }
        }
      })
    );

    startStreamRequest({
      conversationId,
      messageId,
      prompt,
      attachments: [],
      history,
      get,
      set
    });
  },

  send() {
    const state = get();
    const content = state.inputValue.trim();
    const attachments = state.inputAttachments;

    if (content.length === 0 && attachments.length === 0) {
      return;
    }

    let nextCore = state.core;
    let conversationId = state.activeConversationId;

    if (conversationId === undefined) {
      const conversation = createCoreConversation({ title: createConversationTitle(content) });
      conversationId = conversation.id;
      nextCore = chatReducer(nextCore, {
        type: "conversation/create",
        input: conversation
      });
    }

    if (state.streamsByConversation[conversationId] !== undefined) {
      return;
    }

    const requestId = createId("req") as RequestId;
    const assistantMessageId = createId("msg") as MessageId;

    nextCore = chatReducer(nextCore, {
      type: "message/add",
      input: {
        conversationId,
        role: "user",
        content,
        status: "complete",
        attachments
      }
    });
    nextCore = chatReducer(nextCore, {
      type: "request/start",
      conversationId,
      requestId
    });
    nextCore = chatReducer(nextCore, {
      type: "stream/apply",
      event: {
        type: "message_start",
        conversationId,
        messageId: assistantMessageId,
        requestId,
        role: "assistant"
      }
    });

    set(
      deriveState(nextCore, {
        inputValue: "",
        inputAttachments: [],
        streamsByConversation: {
          ...state.streamsByConversation,
          [conversationId]: { requestId, messageId: assistantMessageId }
        }
      })
    );

    const history = selectConversationMessages(nextCore, conversationId);

    startStreamRequest({
      conversationId,
      messageId: assistantMessageId,
      prompt: content,
      attachments: attachments as readonly ChatAttachment[],
      history,
      get,
      set
    });
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

    stream.subscription?.cancel("User cancelled request.");

    let nextCore = chatReducer(state.core, {
      type: "stream/apply",
      event: {
        type: "request_cancelled",
        conversationId,
        requestId: stream.requestId,
        updatedAt: nowIso()
      }
    });
    nextCore = chatReducer(nextCore, {
      type: "request/finish",
      conversationId,
      requestId: stream.requestId
    });

    const nextStreams = { ...state.streamsByConversation };
    delete nextStreams[conversationId];
    set(deriveState(nextCore, { streamsByConversation: nextStreams }));
  },

  addTag(conversationId, tag) {
    commitCore(set, get(), {
      type: "conversation/tag-add",
      conversationId,
      tag
    });
  },

  removeTag(conversationId, tag) {
    commitCore(set, get(), {
      type: "conversation/tag-remove",
      conversationId,
      tag
    });
  },

  exportConversation(conversationId, format) {
    const state = get();
    const conversation = state.core.conversations[conversationId];
    if (conversation === undefined) {
      return null;
    }
    const messages = selectConversationMessages(state.core, conversationId);
    if (format === "json") {
      return exportConversationAsJson(conversation, messages);
    }
    return exportConversationAsMarkdown(conversation, messages);
  },

  enqueueOffline(item) {
    set((state) => ({
      offlineQueue: [...state.offlineQueue, item]
    }));
  },

  dequeueOffline(id) {
    set((state) => ({
      offlineQueue: state.offlineQueue.filter((item) => item.id !== id)
    }));
  },

  async drainOfflineQueue() {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    for (const item of queue) {
      get().dequeueOffline(item.id);
      // 直接通过内部状态触发发送
      const state = get();
      if (state.isSending) continue;

      const current = get();
      set({ inputValue: item.content, inputAttachments: item.attachments });
      // 使用 setTimeout 确保状态已更新
      setTimeout(() => {
        get().send();
      }, 100);
    }
  }
}),
{
  name: "moye-chat-web",
  partialize: (state) => {
    const core = state.core;

    // 过滤掉种子 demo 对话，只持久化用户创建的数据
    const conversations = Object.fromEntries(
      Object.entries(core.conversations).filter(([id]) => !SEED_IDS.has(id as ConversationId))
    );
    const messages = Object.fromEntries(
      Object.entries(core.messages).filter(([, msg]) => !SEED_IDS.has(msg.conversationId))
    );
    const tags = Object.fromEntries(
      Object.entries(core.tags).filter(([id]) => !SEED_IDS.has(id as ConversationId))
    );

    return {
      activeConversationId: state.activeConversationId,
      selectedModelId: state.selectedModelId,
      core: {
        ...core,
        conversations: conversations as typeof core.conversations,
        messages: messages as typeof core.messages,
        tags: tags as typeof core.tags
      }
    };
  },
  // Rehydration 后重新计算派生字段，确保与 core 一致
  onRehydrateStorage: () => {
    return (rehydratedState) => {
      if (rehydratedState) {
        const core = rehydratedState.core;
        const activeConversationId = rehydratedState.activeConversationId;
        rehydratedState.conversations = selectConversationViews(core);
        rehydratedState.activeMessages = activeConversationId
          ? selectConversationMessages(core, activeConversationId)
          : [];
        // 不清空输入状态和连接状态
        rehydratedState.inputValue = "";
        rehydratedState.inputAttachments = [];
        rehydratedState.isSending = false;
        rehydratedState.streamsByConversation = {};
        rehydratedState.offlineQueue = [];
      }
    };
  }
}
));

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
    conversations: selectConversationViews(core),
    isSending,
    ...extra
  };
}

// ============ Stream Request (Real SDK or Simulation) ============

function startStreamRequest(input: {
  conversationId: ConversationId;
  messageId: MessageId;
  prompt: string;
  attachments: readonly ChatAttachment[];
  history: readonly ChatMessage[];
  get: () => ChatStore;
  set: (partial: Partial<ChatStore>) => void;
}): void {
  if (isSimulationMode()) {
    startSimulation(input);
    return;
  }

  startRealStream(input);
}

function startRealStream(input: {
  conversationId: ConversationId;
  messageId: MessageId;
  prompt: string;
  attachments: readonly ChatAttachment[];
  history: readonly ChatMessage[];
  get: () => ChatStore;
  set: (partial: Partial<ChatStore>) => void;
}): void {
  const sdk = createConfiguredChatSdk();
  const requestId = createId("req") as RequestId;

  const applyEvent = (action: ChatAction) => {
    const current = input.get();
    const nextCore = chatReducer(current.core, action);
    input.set(
      deriveState(nextCore, {
        streamsByConversation: current.streamsByConversation
      })
    );
  };

  const cleanup = () => {
    const current = input.get();
    const stream = current.streamsByConversation[input.conversationId];
    if (stream === undefined) return;

    const nextStreams = { ...current.streamsByConversation };
    delete nextStreams[input.conversationId];

    let nextCore = chatReducer(current.core, {
      type: "request/finish",
      conversationId: input.conversationId,
      requestId: stream.requestId
    });
    input.set(deriveState(nextCore, { streamsByConversation: nextStreams }));
  };

  const subscription = sdk.sendMessage(
    {
      conversationId: input.conversationId,
      content: input.prompt,
      attachments: input.attachments,
      history: input.history,
      metadata: { requestId }
    },
    {
      onOpen() {
        // 连接已建立
      },
      onClose() {
        cleanup();
      },
      onError(error) {
        applyEvent({
          type: "stream/apply",
          event: {
            type: "message_error",
            messageId: input.messageId,
            error: error.message
          }
        });
        cleanup();
      },
      onEvent(event) {
        applyEvent({
          type: "stream/apply",
          event
        });
      },
      onRetry(context) {
        // 重连中的状态可以通过 UI store 展示
        console.debug(`[chat-sdk] Retry attempt ${context.attempt}/${context.maxAttempts}, delay ${context.delayMs}ms`);
      },
      onStatusChange(status) {
        if (status.phase === "closed" && status.error) {
          applyEvent({
            type: "stream/apply",
            event: {
              type: "message_error",
              messageId: input.messageId,
              error: status.error.message
            }
          });
          cleanup();
        }
      }
    }
  );

  // 将 subscription 注册到 stream 中，以便 cancel 可以中断
  const current = input.get();
  const stream = current.streamsByConversation[input.conversationId];
  if (stream !== undefined) {
    input.set({
      streamsByConversation: {
        ...current.streamsByConversation,
        [input.conversationId]: { ...stream, subscription }
      }
    });
  }
}

// ============ Simulation Fallback ============

function startSimulation(input: {
  conversationId: ConversationId;
  messageId: MessageId;
  prompt: string;
  get: () => ChatStore;
  set: (partial: Partial<ChatStore>) => void;
}): void {
  const toolCallId = createId("tool") as unknown as ToolCallId;

  const applyEvent = (action: ChatAction) => {
    const current = input.get();
    const nextCore = chatReducer(current.core, action);
    input.set(
      deriveState(nextCore, {
        streamsByConversation: current.streamsByConversation
      })
    );
  };

  const timers: number[] = [];

  timers.push(
    window.setTimeout(() => {
      applyEvent({
        type: "stream/apply",
        event: {
          type: "tool_call",
          messageId: input.messageId,
          toolCall: {
            id: toolCallId,
            name: "context.lookup",
            status: "running",
            argumentsText: JSON.stringify({ query: input.prompt.slice(0, 80) }, null, 2),
            startedAt: nowIso()
          },
          updatedAt: nowIso()
        }
      });
    }, 90)
  );

  timers.push(
    window.setTimeout(() => {
      applyEvent({
        type: "stream/apply",
        event: {
          type: "tool_result",
          messageId: input.messageId,
          toolCallId,
          result: { matched: true, source: "conversation-context" },
          updatedAt: nowIso()
        }
      });
    }, 260)
  );

  const response = createAssistantResponse(input.prompt);
  const tokens = tokenize(response);

  tokens.forEach((token, index) => {
    timers.push(
      window.setTimeout(() => {
        applyEvent({
          type: "stream/apply",
          event: {
            type: "token",
            messageId: input.messageId,
            delta: token,
            updatedAt: nowIso()
          }
        });
      }, 120 + index * 32)
    );
  });

  timers.push(
    window.setTimeout(() => {
      const current = input.get();
      let nextCore = chatReducer(current.core, {
        type: "stream/apply",
        event: {
          type: "message_done",
          messageId: input.messageId,
          finishReason: "stop",
          updatedAt: nowIso()
        }
      });
      nextCore = chatReducer(nextCore, {
        type: "request/finish",
        conversationId: input.conversationId,
        requestId: input.get().streamsByConversation[input.conversationId]?.requestId ?? ("" as RequestId)
      });

      const nextStreams = { ...current.streamsByConversation };
      delete nextStreams[input.conversationId];
      input.set(deriveState(nextCore, { streamsByConversation: nextStreams }));
    }, 220 + tokens.length * 32)
  );

  // 注册能够被 cancel 清理的 subscription（创建假的 cancel）
  const current = input.get();
  const stream = current.streamsByConversation[input.conversationId];
  if (stream !== undefined) {
    input.set({
      streamsByConversation: {
        ...current.streamsByConversation,
        [input.conversationId]: {
          ...stream,
          subscription: {
            requestId: stream.requestId,
            cancel(reason?: string) {
              timers.forEach((timer) => window.clearTimeout(timer));
              console.debug(`[simulation] Cancelled: ${reason ?? "user action"}`);
            }
          }
        }
      }
    });
  }
}

function createAssistantResponse(prompt: string): string {
  return [
    `我已收到你的问题："${prompt}"。`,
    "",
    "我会先拆解目标，再给出可执行的方案：",
    "",
    "```ts",
    "type Step = { title: string; done: boolean };",
    "```",
    "",
    "- 保持上下文清晰",
    "- 优先处理影响体验的路径",
    "- 输出可以直接落地的下一步"
  ].join("\n");
}

// ============ Seed Data ============

function createSeededCore(): ChatState {
  const now = "2026-06-18T12:00:00.000Z" as NonNullable<Parameters<typeof createCoreConversation>[0]>["now"];
  const conversations = [
    createCoreConversation({
      id: "conv_design_review" as ConversationId,
      title: "设计评审助手",
      now
    }),
    createCoreConversation({
      id: "conv_research_brief" as ConversationId,
      title: "竞品研究摘要",
      now
    }),
    createCoreConversation({
      id: "conv_release_plan" as ConversationId,
      title: "发布计划编排",
      now
    })
  ];

  const messages = [
    createMessage({
      id: "msg_design_user" as MessageId,
      conversationId: conversations[0].id,
      role: "user",
      content: "帮我检查这个聊天界面是否有产品感。",
      status: "complete",
      now
    }),
    createMessage({
      id: "msg_design_assistant" as MessageId,
      conversationId: conversations[0].id,
      role: "assistant",
      content:
        "可以。当前重点应该放在信息层级、消息状态和输入区的稳定性上。代码块也应该有清晰的容器，例如：\n\n```tsx\n<MessageBubble status=\"streaming\" />\n```",
      status: "complete",
      now
    }),
    createMessage({
      id: "msg_research_assistant" as MessageId,
      conversationId: conversations[1].id,
      role: "assistant",
      content: "已整理 Claude、ChatGPT、LobeChat 的交互密度差异，下一步可以拆成侧边栏、消息流和工具面板三块。",
      status: "complete",
      now
    }),
    createMessage({
      id: "msg_release_system" as MessageId,
      conversationId: conversations[2].id,
      role: "system",
      content: "发布窗口已锁定，等待补充风险项和回滚策略。",
      status: "complete",
      now
    })
  ];

  let core = createInitialChatState();
  conversations.forEach((conversation) => {
    core = chatReducer(core, {
      type: "conversation/create",
      input: conversation
    });
  });
  core = chatReducer(core, {
    type: "conversation/set-active",
    conversationId: conversations[0].id
  });
  messages.forEach((message) => {
    core = chatReducer(core, {
      type: "message/add",
      input: message
    });
  });

  return core;
}

function selectConversationViews(core: ChatState): readonly ConversationView[] {
  return selectConversations(core).map((conversation) => {
    const messages = selectConversationMessages(core, conversation.id);
    const lastMessage = messages.at(-1);

    return {
      ...conversation,
      lastMessagePreview: lastMessage?.content.replace(/\s+/g, " ").slice(0, 88),
      lastMessageRole: lastMessage?.role
    };
  });
}

function createConversationTitle(content: string): string {
  const title = content.replace(/\s+/g, " ").slice(0, 24);
  return title.length === 0 ? "新对话" : title;
}

function tokenize(content: string): string[] {
  return content.match(/\S+\s*/g) ?? [content];
}
