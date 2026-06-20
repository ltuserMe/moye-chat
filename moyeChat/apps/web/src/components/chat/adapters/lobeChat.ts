import type { ChatMessage as CoreChatMessage } from "@agent-chat/chat-core";
import type { ChatMessage as LobeChatMessage } from "@lobehub/ui/chat";

const roleMap: Record<CoreChatMessage["role"], LobeChatMessage["role"]> = {
  assistant: "assistant",
  system: "system",
  tool: "function",
  user: "user"
};

export function toLobeChatMessage(message: CoreChatMessage): LobeChatMessage {
  return {
    id: message.id,
    content: message.content,
    createAt: 0,
    updateAt: 0,
    role: roleMap[message.role],
    meta: {
      title: titleByRole[message.role],
      description: message.status,
      avatar: avatarByRole[message.role]
    },
    extra: {
      status: message.status,
      toolCalls: message.toolCalls,
      finishReason: message.finishReason,
      error: message.error
    }
  };
}

const titleByRole: Record<CoreChatMessage["role"], string> = {
  assistant: "助手",
  system: "系统",
  tool: "工具",
  user: "你"
};

const avatarByRole: Record<CoreChatMessage["role"], string> = {
  assistant: "助",
  system: "系",
  tool: "工",
  user: "你"
};
