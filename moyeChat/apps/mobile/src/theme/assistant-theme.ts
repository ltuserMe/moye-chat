import { StyleSheet } from "react-native";

import { mobileTokens as t } from "@/components/chat/theme/tokens";

/**
 * assistant-ui 原语组件的主题映射
 * 所有值都从 mobileTokens 派生，禁止硬编码颜色/尺寸/字体
 */
export const assistantTheme = StyleSheet.create({
  // ── Thread (消息列表容器) ──
  thread: {
    flex: 1,
    backgroundColor: t.color.chat,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.lg
  } as const,

  // ── Message (单条消息) ──
  message: {
    flexDirection: "row" as const,
    gap: 10,
    maxWidth: "90%" as const,
    marginBottom: t.spacing.xl
  },
  messageUser: {
    alignSelf: "flex-end" as const,
    flexDirection: "row-reverse" as const
  },
  messageAssistant: {
    alignSelf: "flex-start" as const
  },

  // ── Avatar ──
  avatar: {
    alignItems: "center" as const,
    backgroundColor: t.color.accent,
    borderRadius: 14,
    height: 28,
    justifyContent: "center" as const,
    marginTop: 2,
    width: 28
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700" as const
  },

  // ── Bubble ──
  userBubble: {
    backgroundColor: t.color.userBubble,
    borderBottomRightRadius: 4,
    borderRadius: t.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 0
  },
  assistantBubble: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    minWidth: 0
  },

  // ── Sender name ──
  senderName: {
    color: t.color.textMuted,
    fontSize: t.typography.small.fontSize,
    marginBottom: t.spacing.xs
  },

  // ── Bubble content text ──
  userContent: {
    color: t.color.text,
    fontSize: t.typography.body.fontSize,
    lineHeight: t.typography.body.lineHeight
  },
  assistantContent: {
    color: t.color.text,
    fontSize: t.typography.body.fontSize,
    lineHeight: t.typography.body.lineHeight
  },

  // ── Typing indicator ──
  typingIndicator: {
    flexDirection: "row" as const,
    gap: 4,
    paddingVertical: 8
  },
  typingDot: {
    backgroundColor: t.color.textMuted,
    borderRadius: 3,
    height: 5,
    opacity: 0.55,
    width: 5
  },

  // ── Composer (输入区域) ──
  composer: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderTopColor: "rgba(0,0,0,0.05)",
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.lg,
    right: 0,
    ...t.shadow.bottom
  } as const,
  inputBar: {
    alignItems: "flex-end" as const,
    backgroundColor: t.color.inputMuted,
    borderRadius: t.radius.xl,
    flexDirection: "row" as const,
    gap: t.spacing.sm,
    paddingBottom: t.spacing.xs,
    paddingLeft: t.spacing.md,
    paddingRight: t.spacing.xs,
    paddingTop: t.spacing.xs
  },
  input: {
    color: t.color.text,
    flex: 1,
    fontSize: t.typography.body.fontSize,
    lineHeight: 20,
    paddingHorizontal: 0,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.sm,
    textAlignVertical: "top" as const
  },
  sendButton: {
    alignItems: "center" as const,
    backgroundColor: t.color.accent,
    borderRadius: 16,
    height: 32,
    justifyContent: "center" as const,
    marginBottom: 2,
    marginRight: 2,
    width: 32
  },
  plusButton: {
    alignItems: "center" as const,
    borderRadius: 16,
    height: 32,
    justifyContent: "center" as const,
    marginBottom: 2,
    width: 32
  },

  // ── Tool Card ──
  toolCard: {
    backgroundColor: "#ffffff",
    borderColor: t.color.border,
    borderRadius: t.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginTop: t.spacing.sm,
    padding: 12
  },
  toolHeader: {
    alignItems: "flex-start" as const,
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "space-between" as const
  },
  toolName: {
    color: t.color.text,
    flex: 1,
    fontSize: t.typography.caption.fontSize,
    fontWeight: "700" as const
  },
  codeBlock: {
    backgroundColor: "#f8fafc",
    borderColor: t.color.border,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10
  },
  codeBlockDanger: {
    backgroundColor: t.color.dangerBg,
    borderColor: "#fecaca",
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10
  },
  codeText: {
    color: "#334155",
    fontFamily: "monospace" as const,
    fontSize: t.typography.small.fontSize,
    lineHeight: 17
  },
  codeTextDanger: {
    color: t.color.danger,
    fontFamily: "monospace" as const,
    fontSize: t.typography.small.fontSize,
    lineHeight: 17
  },
  blockLabel: {
    color: t.color.textSecondary,
    fontSize: t.typography.small.fontSize,
    fontWeight: "600" as const,
    marginBottom: 4
  },
  blockLabelDanger: {
    color: t.color.danger,
    fontSize: t.typography.small.fontSize,
    fontWeight: "600" as const,
    marginBottom: 4
  },

  // ── Status Pill ──
  statusPill: {
    alignSelf: "flex-start" as const,
    borderRadius: t.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  statusPillDanger: {
    backgroundColor: t.color.dangerBg
  },
  statusPillMuted: {
    backgroundColor: "#f1f3f4"
  },
  statusPillText: {
    fontSize: t.typography.small.fontSize,
    fontWeight: "600" as const
  },
  statusPillTextDanger: {
    color: t.color.danger
  },
  statusPillTextMuted: {
    color: t.color.textSecondary
  },

  // ── Quick prompt chips ──
  quickTools: {
    flexGrow: 0,
    marginBottom: t.spacing.sm
  },
  quickToolsContent: {
    gap: t.spacing.sm,
    paddingRight: t.spacing.xs
  },
  toolChip: {
    alignItems: "center" as const,
    backgroundColor: "#ffffff",
    borderColor: t.color.border,
    borderRadius: t.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  toolChipText: {
    color: t.color.textSecondary,
    fontSize: 13
  },
  toolChipIcon: {
    color: t.color.textSecondary,
    fontSize: t.typography.caption.fontSize,
    fontWeight: "700" as const
  }
});
