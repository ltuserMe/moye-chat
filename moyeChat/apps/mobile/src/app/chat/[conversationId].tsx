import type { ConversationId } from '@agent-chat/chat-core';
import { useLocalSearchParams } from 'expo-router';

import { ChatScreenContainer } from '@/screens/chat/ChatScreenContainer';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: ConversationId }>();

  return <ChatScreenContainer conversationId={conversationId} />;
}
