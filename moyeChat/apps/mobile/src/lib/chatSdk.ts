import { createChatSdk, FetchSseTransport } from '@agent-chat/chat-sdk';
import Constants from 'expo-constants';

export function createConfiguredChatSdk() {
  const endpoint = process.env.EXPO_PUBLIC_CHAT_STREAM_URL ?? Constants.expoConfig?.extra?.chatStreamUrl;

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new Error('expo.extra.chatStreamUrl is not configured.');
  }

  return createChatSdk({
    transport: new FetchSseTransport({
      endpoint
    })
  });
}
