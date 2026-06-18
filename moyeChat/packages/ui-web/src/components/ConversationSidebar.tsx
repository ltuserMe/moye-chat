"use client";

import type { ConversationId } from "@agent-chat/chat-core";
import { ActionIcon, Button, Tag } from "@lobehub/ui";
import { Dropdown, Input, Modal } from "antd";
import { MessageSquarePlus, MoreHorizontal, Pencil, Search, Trash } from "lucide-react";
import { useMemo, useState } from "react";

import type { ConversationListItem } from "../types";

interface ConversationSidebarProps {
  activeConversationId?: ConversationId;
  conversations: readonly ConversationListItem[];
  onCreateConversation(): void;
  onSelectConversation(conversationId: ConversationId): void;
  onDeleteConversation?(conversationId: ConversationId): void;
  onRenameConversation?(conversationId: ConversationId, title: string): void;
}

const roleLabel: Record<string, string> = {
  assistant: "助手",
  system: "系统",
  tool: "工具",
  user: "你"
};

export function ConversationSidebar(props: ConversationSidebarProps) {
  const [query, setQuery] = useState("");
  const [editingConversation, setEditingConversation] = useState<ConversationListItem>();
  const [draftTitle, setDraftTitle] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const conversations = useMemo(
    () =>
      normalizedQuery.length === 0
        ? props.conversations
        : props.conversations.filter((conversation) =>
            `${conversation.title} ${conversation.lastMessagePreview ?? ""}`
              .toLowerCase()
              .includes(normalizedQuery)
          ),
    [normalizedQuery, props.conversations]
  );

  return (
    <aside className="moye-chat-sidebar" style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>M</div>
        <div>
          <div style={styles.brandTitle}>Moye Agent</div>
          <div style={styles.brandMeta}>智能工作台</div>
        </div>
      </div>

      <div style={styles.actions}>
        <Button block icon={<MessageSquarePlus size={16} />} onClick={props.onCreateConversation} type="primary">
          新建对话
        </Button>
        <label style={styles.search}>
          <Search size={15} color="#7c8798" />
          <input
            aria-label="搜索对话"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索对话"
            style={styles.searchInput}
            value={query}
          />
        </label>
      </div>

      <nav aria-label="对话列表" style={styles.list}>
        {conversations.map((conversation) => {
          const active = conversation.id === props.activeConversationId;

          return (
            <div
              key={conversation.id}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onSelectConversation(conversation.id);
                }
              }}
              onClick={() => props.onSelectConversation(conversation.id)}
              role="button"
              style={{
                ...styles.item,
                ...(active ? styles.itemActive : undefined)
              }}
              tabIndex={0}
            >
              <span style={styles.itemHeader}>
                <span style={styles.itemTitle}>{conversation.title}</span>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "rename",
                        icon: <Pencil size={14} />,
                        label: "重命名"
                      },
                      {
                        danger: true,
                        key: "delete",
                        icon: <Trash size={14} />,
                        label: "删除"
                      }
                    ],
                    onClick: ({ domEvent, key }) => {
                      domEvent.stopPropagation();
                      if (key === "rename") {
                        setEditingConversation(conversation);
                        setDraftTitle(conversation.title);
                        return;
                      }

                      Modal.confirm({
                        centered: true,
                        content: "删除后会移除该对话下的全部消息。",
                        okText: "删除",
                        okType: "danger",
                        onOk: () => props.onDeleteConversation?.(conversation.id),
                        title: `删除「${conversation.title}」？`,
                        cancelText: "取消"
                      });
                    }
                  }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <span
                    onClick={(event) => event.stopPropagation()}
                    style={{ ...styles.itemActions, opacity: active ? 1 : undefined }}
                  >
                    <ActionIcon icon={MoreHorizontal} size="small" title="对话操作" />
                  </span>
                </Dropdown>

                {conversation.activeRequestId !== undefined && <Tag color="blue">生成中</Tag>}
              </span>
              <span style={styles.preview}>
                {conversation.lastMessageRole === undefined ? "暂无消息" : `${roleLabel[conversation.lastMessageRole]} · `}
                {conversation.lastMessagePreview ?? "开始一次新的协作"}
              </span>
              <span style={styles.itemMeta}>{formatRelativeTime(conversation.updatedAt)}</span>
            </div>
          );
        })}
      </nav>
      <Modal
        centered
        okText="保存"
        onCancel={() => setEditingConversation(undefined)}
        onOk={() => {
          if (editingConversation !== undefined) {
            props.onRenameConversation?.(editingConversation.id, draftTitle);
          }
          setEditingConversation(undefined);
        }}
        open={editingConversation !== undefined}
        title="重命名对话"
        cancelText="取消"
      >
        <Input
          autoFocus
          onChange={(event) => setDraftTitle(event.target.value)}
          onPressEnter={() => {
            if (editingConversation !== undefined) {
              props.onRenameConversation?.(editingConversation.id, draftTitle);
            }
            setEditingConversation(undefined);
          }}
          placeholder="输入对话名称"
          value={draftTitle}
        />
      </Modal>
    </aside>
  );
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(timestamp)) {
    return "";
  }

  if (diff < minute) {
    return "刚刚";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

const styles = {
  sidebar: {
    background: "#ffffff",
    borderRight: "1px solid rgba(0,0,0,0.06)",
    display: "grid",
    gridTemplateRows: "auto auto minmax(0, 1fr)",
    minHeight: 0,
    padding: 20
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: 12,
    padding: "4px 4px 20px"
  },
  brandMark: {
    alignItems: "center",
    background: "#111827",
    borderRadius: 10,
    color: "#ffffff",
    display: "flex",
    fontSize: 18,
    fontWeight: 800,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  brandTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: 750,
    letterSpacing: 0
  },
  brandMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2
  },
  actions: {
    display: "grid",
    gap: 12,
    paddingBottom: 16
  },
  search: {
    alignItems: "center",
    background: "#f1f5f9",
    border: "1px solid transparent",
    borderRadius: 10,
    display: "flex",
    gap: 8,
    height: 38,
    padding: "0 11px"
  },
  searchInput: {
    background: "transparent",
    border: 0,
    color: "#111827",
    minWidth: 0,
    outline: 0,
    width: "100%"
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    minHeight: 0,
    overflowY: "auto" as const,
    paddingRight: 2
  },
  item: {
    background: "transparent",
    border: "none",
    borderRadius: 10,
    color: "#334155",
    cursor: "pointer",
    display: "grid",
    gap: 7,
    padding: 12,
    textAlign: "left" as const,
    transition: "background 140ms ease",
    position: "relative" as const
  },
  itemHover: {
    "&:hover .ant-pro-action-icon": {
      opacity: 1
    }
  },
  itemActive: {
    background: "#f1f5f9",
    color: "#0f172a"
  },
  itemHeader: {
    alignItems: "center",
    display: "flex",
    gap: 8,
    justifyContent: "space-between"
  },
  itemTitle: {
    color: "inherit",
    fontSize: 14,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  itemActions: {
    display: "flex",
    gap: 4,
    opacity: 0.78,
    position: "absolute" as const,
    right: 12,
    top: 10,
    transition: "opacity 0.2s ease"
  },
  preview: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.45,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  itemMeta: {
    color: "#94a3b8",
    fontSize: 11
  }
};
