"use client";

import type { ChatAttachment } from "@agent-chat/chat-core";
import { createId, isImage, formatFileSize, getFileIconSvg, guessMimeType } from "@agent-chat/utils";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  StopCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import {
  FileImage as FileImageIcon,
  FileText as FileTextIcon,
  Search,
  Sparkles,
  Wrench
} from "lucide-react";
import { useEffect, useRef } from "react";

import type { ChatModelOption } from "./types";

const quickPrompts = [
  { icon: Sparkles, label: "优化当前 UI 方案" },
  { icon: Search, label: "解释上面的 TSX 代码" },
  { icon: FileTextIcon, label: "生成竞品分析框架" },
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
    if (textarea === null) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [props.value]);

  const handleSend = () => {
    if (props.isSending) { props.onCancel?.(); return; }
    if (canSend) props.onSend();
  };

  const handleFileChange = async (files: FileList | null) => {
    if (files === null || props.onAttachmentsChange === undefined) return;
    const nextAttachments = await Promise.all(
      Array.from(files).map(async (file) => {
        const isImg = file.type.startsWith("image/");
        return {
          id: createId("att") as ChatAttachment["id"],
          name: file.name,
          mimeType: file.type || guessMimeType(file.name),
          size: file.size,
          url: isImg ? await toBase64(file) : URL.createObjectURL(file)
        };
      })
    );
    props.onAttachmentsChange([...attachments, ...nextAttachments]);
  };

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const renderAttachmentCard = (attachment: ChatAttachment) => {
    const isImg = isImage(attachment.mimeType);
    const iconSvg = isImg ? null : getFileIconSvg(attachment.mimeType);
    const sizeText = attachment.size != null ? formatFileSize(attachment.size) : null;

    return (
      <div key={attachment.id} style={isImg ? s.imageCard : s.fileCard}>
        {isImg ? (
          attachment.url ? (
            <img src={attachment.url} alt={attachment.name} style={s.thumbnail} />
          ) : null
        ) : iconSvg ? (
          <img src={iconSvg} alt="" style={s.fileIcon} />
        ) : null}
        {!isImg ? <span style={s.attachmentName}>{attachment.name}</span> : null}
        {!isImg && sizeText ? <span style={s.attachmentSize}>{sizeText}</span> : null}
        <button
          aria-label={`移除 ${attachment.name}`}
          onClick={() => props.onAttachmentsChange?.(attachments.filter((a) => a.id !== attachment.id))}
          style={s.removeBtn}
          type="button"
        >
          <XMarkIcon style={s.removeIcon} />
        </button>
      </div>
    );
  };

  return (
    <footer className="moye-chat-composer" style={s.root}>
      <div style={s.quickToolsContainer}>
        {quickPrompts.map(({ icon: Icon, label }) => (
          <button key={label} onClick={() => props.onInputChange(label)} style={s.toolChip} type="button">
            <Icon aria-hidden="true" style={s.toolChipIcon} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 输入外壳 — 附件 + 输入框无缝衔接 */}
      <div className="moye-chat-composer-shell" style={s.shell}>
        {attachments.length > 0 ? (
          <div style={s.attachmentsGrid}>
            {attachments.map(renderAttachmentCard)}
          </div>
        ) : null}

        <div style={s.textareaWrap}>
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
            style={s.textarea}
            value={props.value}
          />
        </div>

        <div style={s.inputActions}>
          <div style={s.leftActions}>
            <input
              multiple
              onChange={(event) => { handleFileChange(event.target.files); event.target.value = ""; }}
              ref={fileInputRef}
              style={s.fileInput}
              type="file"
            />
            <button aria-label="添加文件" onClick={() => fileInputRef.current?.click()} style={s.attachButton} type="button">
              <PaperClipIcon style={s.attachIcon} />
            </button>
          </div>
          <div style={s.rightActions}>
            <span style={s.shortcutHint}>Enter 发送</span>
            {props.isSending ? (
              <button aria-label="停止生成" onClick={props.onCancel} style={s.stopButton} title="Cancel" type="button">
                <StopCircleIcon style={s.stopIcon} />
              </button>
            ) : (
              <button aria-label="发送消息" disabled={!canSend} onClick={handleSend} style={{ ...s.sendButton, ...(!canSend ? s.sendButtonDisabled : undefined) }} title="Send" type="button">
                <PaperAirplaneIcon style={s.sendIcon} />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

const s = {
  root: { alignItems: "center", background: "linear-gradient(transparent, var(--bg-app) 30%)", display: "flex", flexDirection: "column" as const, padding: "0 24px 24px", pointerEvents: "none" as const },
  quickToolsContainer: { display: "flex", gap: 6, marginBottom: 8, maxWidth: 760, overflowX: "auto" as const, padding: "2px 0", pointerEvents: "auto" as const, scrollbarWidth: "none" as const, whiteSpace: "nowrap" as const, width: "100%" },
  toolChip: { alignItems: "center", background: "var(--bg-composer)", border: "1px solid var(--border-light)", borderRadius: 100, boxShadow: "0 1px 2px rgba(0,0,0,0.02)", color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex", flex: "0 0 auto", fontSize: 12, gap: 4, padding: "5px 10px", transition: "background 0.2s, border-color 0.2s, color 0.2s" },
  toolChipIcon: { flex: "0 0 auto", height: 14, strokeWidth: 1.8, width: 14 },
  shell: { background: "var(--bg-sidebar)", border: "1px solid var(--border-light)", borderRadius: 12, boxShadow: "var(--shadow-md)", display: "grid", gap: 0, margin: "0 auto", maxWidth: 760, padding: "12px 16px", pointerEvents: "auto" as const, transition: "border-color 0.2s, box-shadow 0.2s", width: "100%" },
  attachmentsGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8, paddingBottom: 10 },
  imageCard: { position: "relative" as const, width: 64, height: 64, borderRadius: 8, overflow: "hidden" as const, flexShrink: 0 },
  fileCard: { position: "relative" as const, display: "flex" as const, alignItems: "center" as const, gap: 8, padding: "4px 8px", paddingRight: 28, borderRadius: 8, background: "var(--bg-input)", maxWidth: 220, flexShrink: 0 },
  thumbnail: { width: "100%" as const, height: "100%" as const, objectFit: "cover" as const },
  fileIcon: { width: 32, height: 32, flexShrink: 0 },
  attachmentName: { fontSize: 11, color: "var(--text-secondary)", overflow: "hidden" as const, textOverflow: "ellipsis" as const, whiteSpace: "nowrap" as const, minWidth: 0 },
  attachmentSize: { fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" as const },
  removeBtn: { position: "absolute" as const, top: 3, right: 3, background: "rgba(0,0,0,0.5)", border: 0, borderRadius: 8, color: "#fff", cursor: "pointer", width: 16, height: 16, display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const, padding: 0 },
  removeIcon: { width: 8, height: 8 },
  fileInput: { display: "none" },
  attachButton: { alignItems: "center", background: "transparent", border: 0, borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", padding: 6, width: 28 },
  attachIcon: { height: 16, width: 16 },
  textareaWrap: { width: "100%" },
  textarea: { background: "transparent", border: "none", color: "var(--text-primary)", display: "block", fontFamily: "inherit", fontSize: 14, lineHeight: 1.5, maxHeight: 160, minHeight: 36, outline: "none", overflowY: "auto" as const, padding: 0, resize: "none" as const, width: "100%" },
  inputActions: { alignItems: "center", display: "flex", justifyContent: "space-between", paddingTop: 4 },
  leftActions: { alignItems: "center", display: "flex", gap: 6 },
  rightActions: { alignItems: "center", display: "flex", gap: 6 },
  shortcutHint: { color: "var(--text-muted)", fontSize: 11, marginRight: 4 },
  sendButton: { alignItems: "center", background: "var(--accent)", border: 0, borderRadius: 6, color: "var(--text-inverse)", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", padding: 0, transition: "opacity 0.2s", width: 28 },
  sendButtonDisabled: { cursor: "not-allowed", opacity: 0.35 },
  sendIcon: { height: 14, width: 14 },
  stopButton: { alignItems: "center", background: "var(--accent)", border: 0, borderRadius: 6, color: "var(--text-inverse)", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", padding: 0, width: 28 },
  stopIcon: { height: 16, width: 16 }
};
