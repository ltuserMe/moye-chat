"use client";

import { ChatShell } from "@/components/chat";

import { useChatStore } from "@/stores/chat-store";

export function ChatWorkspace() {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const messages = useChatStore((state) => state.activeMessages);
  const inputValue = useChatStore((state) => state.inputValue);
  const inputAttachments = useChatStore((state) => state.inputAttachments);
  const isSending = useChatStore((state) => state.isSending);
  const models = useChatStore((state) => state.models);
  const selectedModelId = useChatStore((state) => state.selectedModelId);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const setInputAttachments = useChatStore((state) => state.setInputAttachments);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const send = useChatStore((state) => state.send);
  const cancel = useChatStore((state) => state.cancel);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const createConversation = useChatStore((state) => state.createConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const editMessage = useChatStore((state) => state.editMessage);
  const retryMessage = useChatStore((state) => state.retryMessage);

  return (
    <ChatShell
      activeConversationId={activeConversationId}
      conversations={conversations}
      inputAttachments={inputAttachments}
      inputValue={inputValue}
      isSending={isSending}
      messages={messages}
      models={models}
      onCancel={cancel}
      onAttachmentsChange={setInputAttachments}
      onCreateConversation={createConversation}
      onDeleteConversation={deleteConversation}
      onDeleteMessage={deleteMessage}
      onEditMessage={editMessage}
      onExamplePrompt={setInputValue}
      onInputChange={setInputValue}
      onModelChange={setSelectedModel}
      onRenameConversation={renameConversation}
      onRetryMessage={retryMessage}
      onSelectConversation={selectConversation}
      onSend={send}
      selectedModelId={selectedModelId}
    />
  );
}
