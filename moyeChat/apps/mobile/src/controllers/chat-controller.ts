import {
  type ChatAction,
  type ConversationId
} from '@agent-chat/chat-core';
import { createId, nowIso } from '@agent-chat/utils';

import { useAttachmentStore } from '@/stores/attachment-store';
import { useChatStore } from '@/stores/chat-store';
import { useConversationStore } from '@/stores/conversation-store';
import { useUiStore } from '@/stores/ui-store';

export function ensureConversation(): ConversationId {
  const state = useChatStore.getState();
  if (state.activeConversationId !== undefined) {
    return state.activeConversationId;
  }

  return createConversation();
}

export function createConversation(): ConversationId {
  const chatStore = useChatStore.getState();
  chatStore.applyAction({
    input: { title: '新对话' },
    type: 'conversation/create'
  });

  const conversationId = useChatStore.getState().activeConversationId;
  if (conversationId === undefined) {
    throw new Error('Failed to create conversation.');
  }

  useConversationStore.getState().setLastOpenedConversation(conversationId);
  useAttachmentStore.getState().clearInputAttachments();
  useUiStore.getState().closeActionPanel();
  return conversationId;
}

export function selectConversation(conversationId: ConversationId): void {
  useChatStore.getState().applyAction({
    conversationId,
    type: 'conversation/set-active'
  });
  useConversationStore.getState().setLastOpenedConversation(conversationId);
  useAttachmentStore.getState().clearInputAttachments();
  useUiStore.getState().closeActionPanel();
}

export function simulateToolCall(conversationId: ConversationId, prompt: string): void {
  const messageId = createId('msg');
  useChatStore.getState().applyStreamEvent({
    conversationId,
    messageId,
    requestId: createId('req'),
    role: 'assistant',
    type: 'message_start'
  });
  useChatStore.getState().applyStreamEvent({
    messageId,
    toolCall: {
      id: createId('tool'),
      name: prompt,
      status: 'running'
    },
    type: 'tool_call'
  });
}

export function deleteConversation(conversationId: ConversationId): void {
  useChatStore.getState().applyAction({
    type: 'conversation/delete',
    conversationId
  });
}

export function renameConversation(conversationId: ConversationId, title: string): void {
  if (title.trim().length === 0) return;
  useChatStore.getState().applyAction({
    type: 'conversation/update',
    input: { id: conversationId, title: title.trim() }
  });
}

export function deleteMessage(messageId: string): void {
  useChatStore.getState().applyAction({
    type: 'message/delete',
    messageId
  } as ChatAction);
}

export function editMessage(messageId: string, content: string): void {
  if (content.trim().length === 0) return;
  const state = useChatStore.getState();
  const msg = state.core.messages[messageId as unknown as keyof typeof state.core.messages];
  if (!msg) return;

  state.applyAction({
    type: 'message/update',
    input: {
      id: messageId,
      content: content.trim(),
      status: 'complete' as const,
      updatedAt: nowIso()
    }
  } as ChatAction);
}
