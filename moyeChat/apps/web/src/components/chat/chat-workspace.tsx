"use client";

import { ChatShell } from "@agent-chat/ui-web";

import { useChatStore } from "@/stores/chat-store";

export function ChatWorkspace() {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const messages = useChatStore((state) => state.activeMessages);
  const inputValue = useChatStore((state) => state.inputValue);
  const isSending = useChatStore((state) => state.isSending);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const send = useChatStore((state) => state.send);
  const cancel = useChatStore((state) => state.cancel);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const createConversation = useChatStore((state) => state.createConversation);

  return (
    <ChatShell
      activeConversationId={activeConversationId}
      conversations={conversations}
      inputValue={inputValue}
      isSending={isSending}
      messages={messages}
      onCancel={cancel}
      onCreateConversation={createConversation}
      onInputChange={setInputValue}
      onSelectConversation={selectConversation}
      onSend={send}
    />
  );
}
