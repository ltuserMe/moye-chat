import type { ChatAttachment, ConversationId } from '@agent-chat/chat-core';
import {
  selectConversationMessages
} from '@agent-chat/chat-core';
import { useCallback, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  cancelStreaming,
  createConversation,
  ensureConversation,
  selectConversation as selectConversationById,
  sendMessage,
  simulateToolCall
} from '@/controllers/chat-controller';
import { pickDocuments } from '@/services/document-picker';
import { prepareVoiceInput } from '@/services/voice-recorder';
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
  const activeRequestId = useChatStore((state) => state.activeRequestId);
  const inputAttachments = useAttachmentStore((state) => state.inputAttachments);
  const setInputAttachments = useAttachmentStore((state) => state.setInputAttachments);
  const actionPanelOpen = useUiStore((state) => state.actionPanelOpen);
  const bottomAreaHeight = useUiStore((state) => state.bottomAreaHeight);
  const inputHeight = useUiStore((state) => state.inputHeight);
  const inputValue = useUiStore((state) => state.inputValue);
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const setInputValue = useUiStore((state) => state.setInputValue);
  const setInputHeight = useUiStore((state) => state.setInputHeight);
  const setBottomAreaHeight = useUiStore((state) => state.setBottomAreaHeight);
  const openDrawer = useUiStore((state) => state.openDrawer);
  const closeDrawer = useUiStore((state) => state.closeDrawer);
  const closeActionPanel = useUiStore((state) => state.closeActionPanel);
  const toggleActionPanel = useUiStore((state) => state.toggleActionPanel);
  const setGlobalError = useUiStore((state) => state.setGlobalError);
  const setScreenLoading = useUiStore((state) => state.setScreenLoading);
  const setLastOpenedConversation = useConversationStore((state) => state.setLastOpenedConversation);

  const selectedConversationId = routeConversationId ?? activeConversationId;
  const conversations = useMemo(() => getConversationList(core), [core]);
  const messages = useMemo(
    () => (selectedConversationId === undefined ? [] : selectConversationMessages(core, selectedConversationId)),
    [core, selectedConversationId]
  );
  const isCompact = width < 390;
  const isTiny = width < 350 || height < 640;
  const inputMinHeight = isCompact ? 34 : 38;
  const inputMaxHeight = Math.max(inputMinHeight, Math.min(118, Math.floor(height * 0.24)));
  const listBottomPadding = bottomAreaHeight + (isCompact ? 12 : 20);

  useEffect(() => {
    if (routeConversationId !== undefined && routeConversationId !== activeConversationId) {
      selectConversationById(routeConversationId);
    }
  }, [activeConversationId, routeConversationId]);

  const handleCreateConversation = useCallback(() => {
    const conversationId = createConversation();
    setInputValue('');
    setLastOpenedConversation(conversationId);
    closeDrawer();
    return conversationId;
  }, [closeDrawer, setInputValue, setLastOpenedConversation]);

  const handleSelectConversation = useCallback(
    (conversationId: ConversationId) => {
      selectConversationById(conversationId);
      setLastOpenedConversation(conversationId);
      closeDrawer();
    },
    [closeDrawer, setLastOpenedConversation]
  );

  const handleSend = useCallback(async () => {
    if (activeRequestId !== undefined) {
      cancelStreaming();
      return;
    }

    const conversationId = selectedConversationId ?? ensureConversation();
    const draft = inputValue;
    setInputValue('');
    setScreenLoading(true);

    try {
      await sendMessage({
        attachments: inputAttachments,
        content: draft,
        conversationId
      });
    } catch (error) {
      setInputValue(draft);
      setGlobalError(error instanceof Error ? error.message : String(error));
    } finally {
      setScreenLoading(false);
    }
  }, [
    activeRequestId,
    inputAttachments,
    inputValue,
    selectedConversationId,
    setGlobalError,
    setInputValue,
    setScreenLoading
  ]);

  const handleComposerAction = useCallback(
    async (actionId: 'camera' | 'database' | 'file' | 'image') => {
      const conversationId = selectedConversationId ?? ensureConversation();

      try {
        if (actionId === 'database') {
          simulateToolCall(conversationId, '读取 WMS 快照');
          closeActionPanel();
          return;
        }

        const picked = await pickDocuments();
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
    try {
      const voice = await prepareVoiceInput();
      setInputValue(voice.transcriptDraft ?? '');
      setGlobalError('语音输入入口已预留，待接入录音与 ASR 服务。');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : String(error));
    }
  }, [setGlobalError, setInputValue]);

  const handleInputContentSizeChange = useCallback(
    (contentHeight: number) => {
      const nextHeight = Math.max(inputMinHeight, Math.min(inputMaxHeight, Math.ceil(contentHeight)));
      setInputHeight(nextHeight);
    },
    [inputMaxHeight, inputMinHeight, setInputHeight]
  );

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
    inputHeight,
    inputValue,
    isCompact,
    isDrawerOpen,
    isSending,
    isTiny,
    listBottomPadding,
    messages,
    quickPrompts: QUICK_PROMPTS,
    onActionPanelToggle: toggleActionPanel,
    onAttachmentsChange: handleAttachmentsChange,
    onBottomLayout: setBottomAreaHeight,
    onComposerAction: handleComposerAction,
    onCreateConversation: handleCreateConversation,
    onDrawerClose: closeDrawer,
    onDrawerOpen: openDrawer,
    onInputChange: setInputValue,
    onInputContentSizeChange: handleInputContentSizeChange,
    onMessageListDrag: closeActionPanel,
    onMicPress: handleMicPress,
    onSelectConversation: handleSelectConversation,
    onSend: handleSend
  };
}
