import {
  chatReducer,
  createMessage,
  selectConversationMessages,
  type ChatAttachment,
  type ConversationId
} from '@agent-chat/chat-core';
import { createId } from '@agent-chat/utils';

import { createConfiguredChatSdk } from '@/lib/chatSdk';
import { prepareAttachmentsForSend } from '@/services/upload-service';
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

export async function sendMessage(input: {
  attachments: readonly ChatAttachment[];
  content: string;
  conversationId: ConversationId;
}): Promise<void> {
  const chatStore = useChatStore.getState();
  const uiStore = useUiStore.getState();
  const attachmentStore = useAttachmentStore.getState();
  const content = input.content.trim();

  if ((content.length === 0 && input.attachments.length === 0) || chatStore.isSending) {
    return;
  }

  uiStore.closeActionPanel();
  uiStore.setGlobalError(undefined);

  const preparedAttachments = await prepareAttachmentsForSend(input.attachments);
  const attachments = preparedAttachments.map((result) => result.attachment);
  const userMessage = createMessage({
    attachments,
    content,
    conversationId: input.conversationId,
    role: 'user',
    status: 'complete'
  });

  let nextCore = chatReducer(chatStore.core, {
    input: userMessage,
    type: 'message/add'
  });
  useChatStore.getState().syncCore(nextCore);
  attachmentStore.clearInputAttachments();
  chatStore.setSending(true);

  try {
    const sdk = createConfiguredChatSdk();
    const subscription = sdk.sendMessage(
      {
        attachments,
        content,
        conversationId: input.conversationId,
        history: selectConversationMessages(nextCore, input.conversationId)
      },
      {
        onOpen() {
          useUiStore.getState().setOffline(false);
          useUiStore.getState().setGlobalError(undefined);
        },
        onClose() {
          useUiStore.getState().setOffline(false);
          useChatStore.getState().setSending(false);
          useChatStore.getState().setActiveSubscription(undefined, undefined);
        },
        onError(error) {
          appendFrontendError(input.conversationId, error.message);
        },
        onEvent(event) {
          useChatStore.getState().applyStreamEvent(event);
        },
        onRetry(context) {
          useUiStore.getState().setOffline(true);
          useUiStore
            .getState()
            .setGlobalError(`网络不稳定，正在第 ${context.attempt}/${context.maxAttempts} 次重连...`);
        },
        onStatusChange(status) {
          if (status.phase === 'open') {
            useUiStore.getState().setOffline(false);
          }
        }
      }
    );

    nextCore = chatReducer(useChatStore.getState().core, {
      conversationId: input.conversationId,
      requestId: subscription.requestId,
      type: 'request/start'
    });
    useChatStore.getState().syncCore(nextCore);
    useChatStore.getState().setActiveSubscription(subscription, subscription.requestId);
  } catch (error) {
    appendFrontendError(input.conversationId, error instanceof Error ? error.message : String(error));
  }
}

export function cancelStreaming(): void {
  const state = useChatStore.getState();
  if (state.activeConversationId === undefined || state.activeRequestId === undefined) {
    return;
  }

  state.activeSubscription?.cancel('User cancelled request.');
  state.applyStreamEvent({
    conversationId: state.activeConversationId,
    requestId: state.activeRequestId,
    type: 'request_cancelled'
  });
  state.setActiveSubscription(undefined, undefined);
  state.setSending(false);
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

function appendFrontendError(conversationId: ConversationId, message: string): void {
  const errorMessage = createMessage({
    content: message,
    conversationId,
    id: createId('msg'),
    role: 'system',
    status: 'failed'
  });
  const nextCore = chatReducer(useChatStore.getState().core, {
    input: errorMessage,
    type: 'message/add'
  });

  useChatStore.getState().syncCore(nextCore);
  useChatStore.getState().setActiveSubscription(undefined, undefined);
  useChatStore.getState().setSending(false);
  useUiStore.getState().setGlobalError(message);
}
