import type { ChatMessage, ChatState, Conversation, ConversationId, MessageId } from "./types";

export function selectActiveConversation(state: ChatState): Conversation | undefined {
  return state.activeConversationId === undefined
    ? undefined
    : state.conversations[state.activeConversationId];
}

export function selectConversationMessages(
  state: ChatState,
  conversationId: ConversationId
): readonly ChatMessage[] {
  const conversation = state.conversations[conversationId];
  if (conversation === undefined) {
    return [];
  }

  return conversation.messageIds
    .map((messageId) => state.messages[messageId])
    .filter((message): message is ChatMessage => message !== undefined);
}

export function selectMessage(state: ChatState, messageId: MessageId): ChatMessage | undefined {
  return state.messages[messageId];
}

export function selectConversations(state: ChatState): readonly Conversation[] {
  return [...Object.values(state.conversations)].sort((left: Conversation, right: Conversation) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

/**
 * 按标题和消息内容搜索对话
 */
export function searchConversations(
  state: ChatState,
  query: string
): readonly Conversation[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return selectConversations(state);
  }

  return selectConversations(state).filter((conversation) => {
    // 匹配标题
    if (conversation.title.toLowerCase().includes(normalized)) {
      return true;
    }

    // 匹配消息内容
    const messages = selectConversationMessages(state, conversation.id);
    return messages.some((message) =>
      message.content.toLowerCase().includes(normalized)
    );
  });
}

/**
 * 在指定对话中搜索消息
 */
export function searchMessages(
  state: ChatState,
  conversationId: ConversationId,
  query: string
): readonly ChatMessage[] {
  const normalized = query.trim().toLowerCase();
  const messages = selectConversationMessages(state, conversationId);

  if (normalized.length === 0) {
    return messages;
  }

  return messages.filter((message) =>
    message.content.toLowerCase().includes(normalized)
  );
}

/**
 * 按标签筛选对话
 */
export function selectConversationsByTag(
  state: ChatState,
  tag: string
): readonly Conversation[] {
  return selectConversations(state).filter(
    (conversation) => state.tags[conversation.id]?.includes(tag) === true
  );
}

/**
 * 获取所有已有的标签
 */
export function selectAllTags(state: ChatState): readonly string[] {
  const tagSet = new Set<string>();
  for (const tags of Object.values(state.tags)) {
    for (const tag of tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

/**
 * 将对话导出为 Markdown
 */
export function exportConversationAsMarkdown(
  conversation: Conversation,
  messages: readonly ChatMessage[]
): string {
  const lines: string[] = [
    `# ${conversation.title}`,
    "",
    `> 创建时间: ${conversation.createdAt}`,
    `> 更新时间: ${conversation.updatedAt}`,
    `> 消息数量: ${messages.length}`,
    ""
  ];

  for (const message of messages) {
    const roleLabel = ROUTE_LABEL_MAP[message.role] ?? message.role;
    const timestamp = new Date(message.createdAt).toLocaleString("zh-CN");
    lines.push(`### ${roleLabel} · ${timestamp}`);
    lines.push("");
    lines.push(message.content);
    lines.push("");

    if (message.toolCalls.length > 0) {
      for (const toolCall of message.toolCalls) {
        lines.push(`> 工具调用: **${toolCall.name}** (${toolCall.status})`);
        if (toolCall.argumentsText) {
          lines.push("> 参数:");
          lines.push("> ```json");
          lines.push(`> ${toolCall.argumentsText.replace(/\n/g, "\n> ")}`);
          lines.push("> ```");
        }
        if (toolCall.result !== undefined) {
          lines.push("> 结果:");
          lines.push("> ```json");
          lines.push(`> ${JSON.stringify(toolCall.result, null, 2).replace(/\n/g, "\n> ")}`);
          lines.push("> ```");
        }
        if (toolCall.error) {
          lines.push(`> 错误: ${toolCall.error}`);
        }
      }
      lines.push("");
    }

    if (message.status === "failed" && message.error) {
      lines.push(`> ❌ ${message.error}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * 将对话导出为 JSON
 */
export function exportConversationAsJson(
  conversation: Conversation,
  messages: readonly ChatMessage[]
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      conversation,
      messages
    },
    null,
    2
  );
}

const ROUTE_LABEL_MAP: Record<string, string> = {
  assistant: "助手",
  system: "系统",
  tool: "工具",
  user: "用户"
};

