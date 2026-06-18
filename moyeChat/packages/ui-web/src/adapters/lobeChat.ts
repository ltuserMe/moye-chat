import type { ChatMessage as CoreChatMessage } from "@agent-chat/chat-core";
import type { ChatMessage as LobeChatMessage } from "@lobehub/ui/chat";

const roleMap: Record<CoreChatMessage["role"], LobeChatMessage["role"]> = {
  assistant: "assistant",
  system: "system",
  tool: "function",
  user: "user"
};

export function toLobeChatMessage(message: CoreChatMessage): LobeChatMessage {
  const createdAt = Date.parse(message.createdAt);
  const updatedAt = Date.parse(message.updatedAt);

  return {
    id: message.id,
    content: message.content,
    createAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    updateAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
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
  assistant: "Assistant",
  system: "System",
  tool: "Tool",
  user: "You"
};

const avatarByRole: Record<CoreChatMessage["role"], string> = {
  assistant: "AI",
  system: "S",
  tool: "T",
  user: "U"
};
