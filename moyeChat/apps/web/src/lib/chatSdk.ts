import { createChatSdk, FetchSseTransport } from '@agent-chat/chat-sdk';

export function createConfiguredChatSdk() {
  const endpoint = process.env.NEXT_PUBLIC_CHAT_STREAM_URL;

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new Error('NEXT_PUBLIC_CHAT_STREAM_URL is not configured.');
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

/** 是否启用模拟模式：未配置后端 URL 时自动启用，或通过环境变量显式启用 */
export function isSimulationMode(): boolean {
  const endpoint = process.env.NEXT_PUBLIC_CHAT_STREAM_URL;
  const configured = typeof endpoint === 'string' && endpoint.length > 0;
  if (!configured) return true;
  return process.env.NEXT_PUBLIC_SIMULATE === 'true';
}
