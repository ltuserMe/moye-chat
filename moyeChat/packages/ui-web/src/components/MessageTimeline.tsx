"use client";

import type { ChatMessage } from "@agent-chat/chat-core";
import { Text } from "@lobehub/ui";
import { ChatList, type RenderMessageExtra } from "@lobehub/ui/chat";
import { useEffect, useMemo, useRef } from "react";

import { toLobeChatMessage } from "../adapters/lobeChat";
import { InlineToolCalls } from "./ToolCallPanel";

interface MessageTimelineProps {
  messages: readonly ChatMessage[];
}

export function MessageTimeline({ messages }: MessageTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const data = useMemo(() => messages.map(toLobeChatMessage), [messages]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement === null) {
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  return (
    <div ref={scrollRef} style={styles.scroll}>
      <div style={styles.inner}>
        {messages.length === 0 ? (
          <div style={styles.empty}>
            <Text type="secondary">Start a conversation with the agent.</Text>
          </div>
        ) : null}
        <ChatList
          data={data}
          renderMessagesExtra={renderMessagesExtra}
          showAvatar
          showTitle
          variant="bubble"
        />
      </div>
    </div>
  );
}

const renderMessagesExtra: Record<string, RenderMessageExtra> = {
  assistant: (message) => <InlineToolCalls toolCalls={message.extra?.toolCalls ?? []} />,
  function: (message) => <InlineToolCalls toolCalls={message.extra?.toolCalls ?? []} />
};

const styles = {
  scroll: {
    minHeight: 0,
    overflowY: "auto" as const
  },
  inner: {
    margin: "0 auto",
    maxWidth: 980,
    padding: "28px 32px"
  },
  empty: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minHeight: 280
  }
};
