import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConversationId } from '@agent-chat/chat-core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ConversationStore {
  lastOpenedConversationId?: ConversationId;
  searchQuery: string;
  setLastOpenedConversation(conversationId?: ConversationId): void;
  setSearchQuery(query: string): void;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      searchQuery: '',

      setLastOpenedConversation(conversationId) {
        set({ lastOpenedConversationId: conversationId });
      },

      setSearchQuery(query) {
        set({ searchQuery: query });
      }
    }),
    {
      name: 'moye-chat-mobile-conv',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
