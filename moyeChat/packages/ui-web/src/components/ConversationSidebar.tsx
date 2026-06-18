"use client";

import type { ConversationId } from "@agent-chat/chat-core";
import { Button, Tag } from "@lobehub/ui";
import { Plus } from "lucide-react";

import type { ConversationListItem } from "../types";

interface ConversationSidebarProps {
  activeConversationId?: ConversationId;
  conversations: readonly ConversationListItem[];
  onCreateConversation(): void;
  onSelectConversation(conversationId: ConversationId): void;
}

export function ConversationSidebar(props: ConversationSidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <Button block icon={<Plus size={16} />} onClick={props.onCreateConversation} type="primary">
          New chat
        </Button>
      </div>

      <nav aria-label="Conversations" style={styles.list}>
        {props.conversations.map((conversation) => {
          const active = conversation.id === props.activeConversationId;

          return (
          <Button
            block
            key={conversation.id}
            onClick={() => props.onSelectConversation(conversation.id)}
            style={styles.item}
            type={active ? "primary" : "text"}
          >
            <span style={styles.itemText}>{conversation.title}</span>
            {conversation.activeRequestId === undefined ? null : <Tag color="blue">Live</Tag>}
          </Button>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: 0
  },
  sidebarHeader: {
    padding: 16
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    minHeight: 0,
    overflowY: "auto" as const,
    padding: "0 8px 16px"
  },
  item: {
    alignItems: "center",
    display: "flex",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 42,
    paddingInline: 12,
    textAlign: "left" as const
  },
  itemText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  }
};
