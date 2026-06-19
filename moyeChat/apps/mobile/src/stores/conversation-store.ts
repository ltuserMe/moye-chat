import type { ConversationId } from '@agent-chat/chat-core';
import { create } from 'zustand';

interface ConversationStore {
  lastOpenedConversationId?: ConversationId;
  searchQuery: string;
  setLastOpenedConversation(conversationId?: ConversationId): void;
  setSearchQuery(query: string): void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  searchQuery: '',

  setLastOpenedConversation(conversationId) {
    set({ lastOpenedConversationId: conversationId });
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
  }
}));
