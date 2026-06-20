import type { ChatAttachment, ConversationId } from '@agent-chat/chat-core';
import { useCallback, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  createConversation,
  deleteConversation,
  deleteMessage,
  editMessage,
  ensureConversation,
  renameConversation,
  selectConversation as selectConversationById,
  simulateToolCall
} from '@/controllers/chat-controller';
import { pickDocuments } from '@/services/document-picker';
import { useAttachmentStore } from '@/stores/attachment-store';
import { getConversationList, useChatStore } from '@/stores/chat-store';
import { useConversationStore } from '@/stores/conversation-store';
import { useUiStore } from '@/stores/ui-store';

const QUICK_PROMPTS = [
  { icon: '*', label: '优化当前 UI 方案' },
  { icon: '?', label: '解释上面的代码' },
  { icon: '#', label: '生成分析报告' }
] as const;

export function useChatController(routeConversationId?: ConversationId) {
  const { width, height } = useWindowDimensions();
  const core = useChatStore((state) => state.core);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isSending = useChatStore((state) => state.isSending);
  const inputAttachments = useAttachmentStore((state) => state.inputAttachments);
  const setInputAttachments = useAttachmentStore((state) => state.setInputAttachments);
  const actionPanelOpen = useUiStore((state) => state.actionPanelOpen);
  const bottomAreaHeight = useUiStore((state) => state.bottomAreaHeight);
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const setBottomAreaHeight = useUiStore((state) => state.setBottomAreaHeight);
  const openDrawer = useUiStore((state) => state.openDrawer);
  const closeDrawer = useUiStore((state) => state.closeDrawer);
  const closeActionPanel = useUiStore((state) => state.closeActionPanel);
  const toggleActionPanel = useUiStore((state) => state.toggleActionPanel);
  const setGlobalError = useUiStore((state) => state.setGlobalError);
  const setLastOpenedConversation = useConversationStore((state) => state.setLastOpenedConversation);

  const selectedConversationId = routeConversationId ?? activeConversationId;
  const conversations = useMemo(() => getConversationList(core), [core]);
  const isCompact = width < 390;
  const isTiny = width < 350 || height < 640;
  const listBottomPadding = bottomAreaHeight + (isCompact ? 12 : 20);

  useEffect(() => {
    if (routeConversationId !== undefined && routeConversationId !== activeConversationId) {
      selectConversationById(routeConversationId);
    }
  }, [activeConversationId, routeConversationId]);

  const handleCreateConversation = useCallback(() => {
    const conversationId = createConversation();
    setLastOpenedConversation(conversationId);
    closeDrawer();
    return conversationId;
  }, [closeDrawer, setLastOpenedConversation]);

  const handleSelectConversation = useCallback(
    (conversationId: ConversationId) => {
      selectConversationById(conversationId);
      setLastOpenedConversation(conversationId);
      closeDrawer();
    },
    [closeDrawer, setLastOpenedConversation]
  );

  const handleComposerAction = useCallback(
    async (actionId: 'camera' | 'database' | 'file' | 'image') => {
      const conversationId = selectedConversationId ?? ensureConversation();

      try {
        if (actionId === 'database') {
          simulateToolCall(conversationId, '读取 WMS 快照');
          closeActionPanel();
          return;
        }

        const { attachments: picked, errors } = await pickDocuments();
        if (errors.length > 0) {
          setGlobalError(errors.join('\n'));
        }
        if (picked.length > 0) {
          setInputAttachments([...inputAttachments, ...picked]);
        }
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : String(error));
      }
    },
    [closeActionPanel, inputAttachments, selectedConversationId, setGlobalError, setInputAttachments]
  );

  const handleMicPress = useCallback(async () => {
    setGlobalError('语音输入入口已预留，待接入录音与 ASR 服务。');
  }, [setGlobalError]);

  const handleAttachmentsChange = useCallback(
    (attachments: readonly ChatAttachment[]) => {
      setInputAttachments(attachments);
    },
    [setInputAttachments]
  );

  return {
    actionPanelOpen,
    activeConversationId: selectedConversationId,
    attachments: inputAttachments,
    conversations,
    isCompact,
    isDrawerOpen,
    isSending,
    isTiny,
    listBottomPadding,
    quickPrompts: QUICK_PROMPTS,
    onActionPanelToggle: toggleActionPanel,
    onAttachmentsChange: handleAttachmentsChange,
    onBottomLayout: setBottomAreaHeight,
    onComposerAction: handleComposerAction,
    onCreateConversation: handleCreateConversation,
    onDrawerClose: closeDrawer,
    onDrawerOpen: openDrawer,
    onMessageListDrag: closeActionPanel,
    onMicPress: handleMicPress,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation: deleteConversation,
    onRenameConversation: renameConversation,
    onDeleteMessage: deleteMessage,
    onEditMessage: editMessage
  };
}
