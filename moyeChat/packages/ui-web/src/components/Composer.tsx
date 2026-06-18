"use client";

import type { ChatAttachment } from "@agent-chat/chat-core";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  StopCircleIcon
} from "@heroicons/react/24/solid";
import { FileText, Search, Sparkles, Wrench } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ChatModelOption } from "../types";

const quickPrompts = [
  { icon: Sparkles, label: "优化当前 UI 方案" },
  { icon: Search, label: "解释上面的 TSX 代码" },
  { icon: FileText, label: "生成竞品分析框架" },
  { icon: Wrench, label: "检查排版语法缺陷" }
];

interface ChatComposerProps {
  value: string;
  attachments?: readonly ChatAttachment[];
  isSending?: boolean;
  models?: readonly ChatModelOption[];
  selectedModelId?: string;
  tokenCount?: number;
  onInputChange(value: string): void;
  onAttachmentsChange?(attachments: readonly ChatAttachment[]): void;
  onModelChange?(modelId: string): void;
  onSend(): void;
  onCancel?(): void;
}

export function ChatComposer(props: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = props.attachments ?? [];
  const canSend = props.value.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea === null) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [props.value]);

  const handleSend = () => {
    if (props.isSending) {
      props.onCancel?.();
      return;
    }

    if (canSend) {
      props.onSend();
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files === null || props.onAttachmentsChange === undefined) {
      return;
    }

    const nextAttachments = Array.from(files).map((file) => ({
      id: createAttachmentId(),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    props.onAttachmentsChange([...attachments, ...nextAttachments]);
  };

  return (
    <footer className="moye-chat-composer" style={styles.root}>
      <div style={styles.quickToolsContainer}>
        {quickPrompts.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => props.onInputChange(label)}
            style={styles.toolChip}
            type="button"
          >
            <Icon aria-hidden="true" style={styles.toolChipIcon} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="moye-chat-composer-shell" style={styles.shell}>
        {attachments.length > 0 ? (
          <div style={styles.attachmentsPanel}>
            <ul style={styles.attachmentsList}>
              {attachments.map((attachment) => (
                <li key={attachment.id} style={styles.attachment}>
                  <span style={styles.attachmentName}>{attachment.name}</span>
                  <button
                    aria-label={`移除 ${attachment.name}`}
                    onClick={() =>
                      props.onAttachmentsChange?.(
                        attachments.filter((current) => current.id !== attachment.id)
                      )
                    }
                    style={styles.removeAttachmentButton}
                    type="button"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={styles.textareaWrap}>
          <textarea
            onChange={(event) => props.onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息，Shift + Enter 换行"
            ref={textareaRef}
            rows={1}
            style={styles.textarea}
            value={props.value}
          />
        </div>

        <div style={styles.inputActions}>
          <div style={styles.leftActions}>
            <input
              multiple
              onChange={(event) => {
                handleFileChange(event.target.files);
                event.target.value = "";
              }}
              ref={fileInputRef}
              style={styles.fileInput}
              type="file"
            />
            <button
              aria-label="添加文件"
              onClick={() => fileInputRef.current?.click()}
              style={styles.attachButton}
              type="button"
            >
              <PaperClipIcon style={styles.attachIcon} />
            </button>
          </div>

          <div style={styles.rightActions}>
            <span style={styles.shortcutHint}>Enter 发送</span>
            {props.isSending ? (
              <button
                aria-label="停止生成"
                onClick={props.onCancel}
                style={styles.stopButton}
                title="Cancel"
                type="button"
              >
                <StopCircleIcon style={styles.stopIcon} />
              </button>
            ) : (
              <button
                aria-label="发送消息"
                disabled={!canSend}
                onClick={handleSend}
                style={{
                  ...styles.sendButton,
                  ...(!canSend ? styles.sendButtonDisabled : undefined)
                }}
                title="Send"
                type="button"
              >
                <PaperAirplaneIcon style={styles.sendIcon} />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function createAttachmentId(): ChatAttachment["id"] {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `att_${random}` as ChatAttachment["id"];
}

const styles = {
  root: {
    alignItems: "center",
    background: "linear-gradient(transparent, #f8f9fa 30%)",
    display: "flex",
    flexDirection: "column" as const,
    padding: "0 24px 24px",
    pointerEvents: "none" as const
  },
  quickToolsContainer: {
    display: "flex",
    gap: 6,
    marginBottom: 8,
    maxWidth: 760,
    overflowX: "auto" as const,
    padding: "2px 0",
    pointerEvents: "auto" as const,
    scrollbarWidth: "none" as const,
    whiteSpace: "nowrap" as const,
    width: "100%"
  },
  toolChip: {
    alignItems: "center",
    background: "rgba(255,255,255,0.8)",
    border: "1px solid #ededed",
    borderRadius: 100,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    color: "#5f6368",
    cursor: "pointer",
    display: "inline-flex",
    flex: "0 0 auto",
    fontSize: 12,
    gap: 4,
    padding: "5px 10px",
    transition: "background 0.2s, border-color 0.2s, color 0.2s"
  },
  toolChipIcon: {
    flex: "0 0 auto",
    height: 14,
    strokeWidth: 1.8,
    width: 14
  },
  shell: {
    background: "#ffffff",
    border: "1px solid #ededed",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
    display: "grid",
    gap: 8,
    margin: "0 auto",
    maxWidth: 760,
    padding: "12px 16px",
    pointerEvents: "auto" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
    width: "100%"
  },
  attachmentsPanel: {
    borderBottom: "1px solid #ededed",
    paddingBottom: 8
  },
  attachmentsList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  attachment: {
    alignItems: "center",
    background: "#f1f3f4",
    borderRadius: 999,
    color: "#5f6368",
    display: "flex",
    fontSize: 12,
    gap: 8,
    maxWidth: 260,
    padding: "4px 10px 4px 12px"
  },
  attachmentName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  removeAttachmentButton: {
    background: "transparent",
    border: 0,
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: 0
  },
  fileInput: {
    display: "none"
  },
  attachButton: {
    alignItems: "center",
    background: "transparent",
    border: 0,
    borderRadius: 6,
    color: "#5f6368",
    cursor: "pointer",
    display: "inline-flex",
    height: 28,
    justifyContent: "center",
    padding: 6,
    width: 28
  },
  attachIcon: {
    height: 16,
    width: 16
  },
  textareaWrap: {
    width: "100%"
  },
  textarea: {
    background: "transparent",
    border: "none",
    color: "#1a1a1a",
    display: "block",
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.5,
    maxHeight: 160,
    minHeight: 36,
    outline: "none",
    overflowY: "auto" as const,
    padding: 0,
    resize: "none" as const,
    width: "100%"
  },
  inputActions: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 4
  },
  leftActions: {
    alignItems: "center",
    display: "flex",
    gap: 6
  },
  rightActions: {
    alignItems: "center",
    display: "flex",
    gap: 6
  },
  shortcutHint: {
    color: "#80868b",
    fontSize: 11,
    marginRight: 4
  },
  sendButton: {
    alignItems: "center",
    background: "#000000",
    border: 0,
    borderRadius: 6,
    color: "#ffffff",
    cursor: "pointer",
    display: "inline-flex",
    height: 28,
    justifyContent: "center",
    padding: 0,
    transition: "opacity 0.2s",
    width: 28
  },
  sendButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.35
  },
  sendIcon: {
    height: 14,
    width: 14
  },
  stopButton: {
    alignItems: "center",
    background: "#000000",
    border: 0,
    borderRadius: 6,
    color: "#ffffff",
    cursor: "pointer",
    display: "inline-flex",
    height: 28,
    justifyContent: "center",
    padding: 0,
    width: 28
  },
  stopIcon: {
    height: 16,
    width: 16
  }
};
