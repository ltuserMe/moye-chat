import type { ChatMessage, ConversationId, ToolCall } from "@agent-chat/chat-core";
import type {
  ChatModelAdapter,
  ChatModelRunResult,
  ThreadMessageLike,
  ThreadUserMessage
} from "@assistant-ui/react-native";
import type {
  StreamEvent
} from "@agent-chat/chat-core";

import { createConfiguredChatSdk, isSimulationMode } from "@/lib/chatSdk";
import { useAttachmentStore } from "@/stores/attachment-store";
import { useChatStore } from "@/stores/chat-store";
import { prepareAttachmentsForSend } from "@/services/upload-service";

/**
 * ChatMessage → ThreadMessageLike
 * 将我们的领域消息模型转换为 assistant-ui 消费的格式
 */
export function toThreadMessageLike(msg: ChatMessage): ThreadMessageLike {
  const base = {
    id: msg.id,
    createdAt: new Date(msg.createdAt)
  };

  if (msg.role === "user") {
    return {
      ...base,
      role: "user" as const,
      content: msg.content
        ? [{ type: "text" as const, text: msg.content }]
        : [],
      attachments: msg.attachments.map((att) =>
        ({
          id: att.id,
          name: att.name,
          type: (att.mimeType.startsWith("image/") ? "image" : "file"),
          url: att.url ?? ""
        } as unknown as ThreadUserMessage["attachments"][number])
      )
    } as unknown as ThreadUserMessage;
  }

  const contentParts: Array<{ type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown; status: string }> = [];

  if (msg.content.length > 0) {
    contentParts.push({ type: "text", text: msg.content });
  }

  for (const tc of msg.toolCalls) {
    contentParts.push({
      type: "tool-call",
      toolCallId: tc.id,
      toolName: tc.name,
      args: safeJsonParse(tc.argumentsText ?? "{}"),
      status: mapStatus(tc.status)
    });
  }

  if (contentParts.length === 0) {
    contentParts.push({ type: "text", text: "" });
  }

  return {
    ...base,
    role: msg.role === "system" || msg.role === "tool" ? "system" : "assistant",
    content: contentParts as ThreadMessageLike["content"]
  } as ThreadMessageLike;
}

/**
 * 批量转换
 */
export function toThreadMessageLikes(
  msgs: readonly ChatMessage[]
): ThreadMessageLike[] {
  return msgs.map(toThreadMessageLike);
}

/**
 * 从 assistant-ui 消息内容中提取纯文本
 */
export function extractText(
  content: ThreadMessageLike["content"]
): string {
  return (content as Array<{ type: string; text?: string }>)
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

/**
 * 创建 ChatModelAdapter，桥接到现有的 chat-sdk
 */
export function createStreamAdapter(
  conversationId: ConversationId
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const lastUserMsg = [...messages].reverse().find(
        (m) => m.role === "user"
      );
      const content = lastUserMsg
        ? extractText(lastUserMsg.content)
        : "";

      // 先拿附件
      const attachmentStore = useAttachmentStore.getState();
      const attachments = attachmentStore.inputAttachments;
      const prepared = await prepareAttachmentsForSend(attachments);

      // 文字和附件都为空才跳过
      if (content.length === 0 && prepared.length === 0) {
        yield { content: [{ type: "text", text: "" }] };
        return;
      }

      if (prepared.length > 0) {
        attachmentStore.clearInputAttachments();
      }

      // 模拟模式回退
      if (isSimulationMode()) {
        const attachNames = prepared.map((r) => r.attachment.name).join("、");
        const attachInfo = attachNames ? `\n\n📎 已收到文件: ${attachNames}` : "";
        yield* simulateResponse(content + attachInfo);
        return;
      }

      const sdk = createConfiguredChatSdk();
      const history = toChatHistory(messages);

      // 创建 AbortController 用于取消
      const controller = new AbortController();
      abortSignal?.addEventListener("abort", () => controller.abort());

      try {
        const pending: Array<{ type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown; status: string }> = [];

        await new Promise<void>((resolve, reject) => {
          const subscription = sdk.sendMessage(
            {
              conversationId,
              content,
              attachments: prepared.map((r) => r.attachment),
              history
            },
            {
              onEvent(event: StreamEvent) {
                // 将 stream event 转换为 content parts
                switch (event.type) {
                  case "token":
                    pending.push({ type: "text", text: event.delta });
                    break;
                  case "tool_call":
                    pending.push({
                      type: "tool-call",
                      toolCallId: event.toolCall.id,
                      toolName: event.toolCall.name,
                      args: safeJsonParse(
                        event.toolCall.argumentsText ?? "{}"
                      ),
                      status: event.toolCall.status
                    });
                    break;
                  case "tool_result":
                    // tool_result 更新前一个 tool-call 的 result
                    break;
                  case "message_done":
                    resolve();
                    break;
                  case "message_error":
                    reject(new Error(event.error));
                    break;
                  case "request_cancelled":
                    resolve();
                    break;
                  default:
                    break;
                }
              },
              onError(error: Error) {
                reject(error);
              },
              onClose() {
                resolve();
              }
            }
          );

          // 将 subscription 注册以便外部取消
          controller.signal?.addEventListener("abort", () => {
            subscription.cancel("Cancelled by user");
          });
        });

        // 将所有收集到的 parts yield 出去
        if (pending.length > 0) {
          for (const part of pending) {
            yield { content: [part] as ChatModelRunResult["content"] };
          }
        } else {
          yield {
            content: [
              { type: "text", text: "收到请求，正在处理..." }
            ] as ChatModelRunResult["content"]
          };
        }
      } catch (error) {
        yield {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "请求失败"
            }
          ] as ChatModelRunResult["content"]
        };
      }
    }
  };
}

/**
 * assistant-ui messages → our ChatMessage[] (仅用于 history)
 */
function toChatHistory(
  messages: readonly ThreadMessageLike[]
): ChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    conversationId: "" as ConversationId,
    role: m.role as ChatMessage["role"],
    content: extractText(m.content),
    status: "complete" as const,
    createdAt: (m.createdAt?.toISOString?.() ?? new Date().toISOString()) as string & { __brand: "ISODateTime" },
    updatedAt: (m.createdAt?.toISOString?.() ?? new Date().toISOString()) as string & { __brand: "ISODateTime" },
    toolCalls: [],
    attachments:
      "attachments" in m
        ? ((m as unknown as { attachments?: Array<{ id: string; name: string; type: string; url: string }> }).attachments?.map(
            (a: { id: string; name: string; type: string; url: string }) => ({
              id: a.id,
              name: a.name,
              mimeType:
                a.type === "image" ? "image/png" : "application/octet-stream",
              url: a.url
            })
          ) ?? [])
        : []
  })) as unknown as ChatMessage[];
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function mapStatus(status: ToolCall["status"]): string {
  switch (status) {
    case "done": return "complete";
    case "failed": return "incomplete";
    case "running": return "running";
    default: return "pending";
  }
}

/** 模拟流式响应 — 无后端环境下的回退 */
async function* simulateResponse(
  prompt: string
): AsyncGenerator<ChatModelRunResult> {
  const response = [
    `已收到你的提问。当前在模拟模式下运行。`,
    "",
    `配置 \`EXPO_PUBLIC_CHAT_STREAM_URL\` 后接入真实 SSE 流式后端，`,
    `所有 assistant-ui 原语正常工作。`,
    "",
    `\`\`\`bash`,
    `EXPO_PUBLIC_CHAT_STREAM_URL=https://your-backend/chat`,
    `\`\`\``,
    "",
    `可以继续测试：发送消息、+ 号添加附件、`,
    `左侧菜单切换对话、消息下方复制 / 刷新图标。`
  ].join("\n");

  // 按字符模拟流式输出 — 每次 yield 累积的完整文本
  const chars = [...response];
  let accumulated = "";
  for (let i = 0; i < chars.length; i += 1) {
    accumulated += chars[i];
    yield {
      content: [{ type: "text", text: accumulated }]
    } as ChatModelRunResult;
    await delay(24);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
