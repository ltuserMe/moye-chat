import { useMemo } from "react";
import { useLocalRuntime } from "@assistant-ui/react-native";
import type { ConversationId } from "@agent-chat/chat-core";

import { getActiveMessages, useChatStore } from "@/stores/chat-store";
import {
  toThreadMessageLikes,
  createStreamAdapter
} from "@/adapters/assistant-runtime-adapter";

/**
 * assistant-ui LocalRuntime hook
 *
 * 使用 useLocalRuntime + ChatModelAdapter 将 assistant-ui 的
 * 运行时桥接到我们现有的 chat-sdk 和 chat-controller。
 *
 * assistant-ui 负责渲染（Thread/Message/Composer），
 * 我们的 stores/controllers 保持状态所有权。
 */
export function useAssistantRuntime(conversationId: ConversationId) {
  const core = useChatStore((s) => s.core);
  const isSending = useChatStore((s) => s.isSending);

  const initialMessages = useMemo(
    () => toThreadMessageLikes(getActiveMessages(core)),
    [core]
  );

  const adapter = useMemo(
    () => createStreamAdapter(conversationId),
    [conversationId]
  );

  return useLocalRuntime(adapter, {
    initialMessages
  });
}
