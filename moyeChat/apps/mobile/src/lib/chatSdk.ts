import { createChatSdk, FetchSseTransport } from '@agent-chat/chat-sdk';
import Constants from 'expo-constants';

export function createConfiguredChatSdk() {
  const endpoint =
    process.env.EXPO_PUBLIC_CHAT_STREAM_URL ??
    Constants.expoConfig?.extra?.chatStreamUrl;

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new Error('expo.extra.chatStreamUrl is not configured.');
  }

  return createChatSdk({
    transport: new FetchSseTransport({
      endpoint,
      idleTimeoutMs: 45_000,
      retry: {
        baseDelayMs: 600,
        maxAttempts: 5,
        maxDelayMs: 8_000
      }
    })
  });
}

/** 是否启用模拟模式：未配置后端 URL 时自动启用 */
export function isSimulationMode(): boolean {
  const endpoint =
    process.env.EXPO_PUBLIC_CHAT_STREAM_URL ??
    Constants.expoConfig?.extra?.chatStreamUrl;
  const configured = typeof endpoint === 'string' && endpoint.length > 0;
  if (!configured) return true;
  return process.env.EXPO_PUBLIC_SIMULATE === 'true';
}
