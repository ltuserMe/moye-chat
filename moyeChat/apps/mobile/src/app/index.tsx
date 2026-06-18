import type { ChatAttachment } from '@agent-chat/chat-core';
import { MobileChatScreen } from '@agent-chat/ui-mobile';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createId } from '@agent-chat/utils';

import { useChatStore } from '@/stores/chat-store';

export default function HomeScreen() {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const messages = useChatStore((state) => state.activeMessages);
  const inputValue = useChatStore((state) => state.inputValue);
  const inputAttachments = useChatStore((state) => state.inputAttachments);
  const isSending = useChatStore((state) => state.isSending);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const setInputAttachments = useChatStore((state) => state.setInputAttachments);
  const createConversation = useChatStore((state) => state.createConversation);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const send = useChatStore((state) => state.send);
  const cancel = useChatStore((state) => state.cancel);

  const pickAttachments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true
    });

    if (result.canceled) {
      return;
    }

    const pickedAttachments: ChatAttachment[] = result.assets.map((asset) => ({
      id: createId('att'),
      mimeType: asset.mimeType ?? 'application/octet-stream',
      name: asset.name,
      size: asset.size,
      url: asset.uri
    }));

    setInputAttachments([...inputAttachments, ...pickedAttachments]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MobileChatScreen
        attachments={inputAttachments}
        conversationId={activeConversationId}
        conversations={conversations}
        inputValue={inputValue}
        isSending={isSending}
        messages={messages}
        onAttachmentsChange={setInputAttachments}
        onCancel={cancel}
        onCreateConversation={createConversation}
        onInputChange={setInputValue}
        onPickAttachments={pickAttachments}
        onSelectConversation={selectConversation}
        onSend={send}
      />
    </SafeAreaView>
  );
}
