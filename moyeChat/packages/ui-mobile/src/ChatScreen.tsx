import type { ChatAttachment, ChatMessage, Conversation, ConversationId, ToolCall } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-native-markdown-display";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";

export interface MobileChatScreenProps {
  conversationId?: ConversationId;
  conversations?: readonly Conversation[];
  attachments?: readonly ChatAttachment[];
  messages: readonly ChatMessage[];
  inputValue: string;
  isSending?: boolean;
  onInputChange(value: string): void;
  onAttachmentsChange?(attachments: readonly ChatAttachment[]): void;
  onCreateConversation?(): void;
  onSelectConversation?(conversationId: ConversationId): void;
  onPickAttachments?(): void | Promise<void>;
  onSend(): void;
  onCancel?(): void;
}

const quickPrompts = [
  { icon: "*", label: "优化当前 UI 方案" },
  { icon: "?", label: "解释上面的代码" },
  { icon: "#", label: "生成分析框架" },
  { icon: "!", label: "检查排版缺陷" }
];

export function MobileChatScreen(props: MobileChatScreenProps): ReactElement {
  const { height, width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomAreaHeight, setBottomAreaHeight] = useState(170);
  const attachments = props.attachments ?? [];
  const activeConversation = props.conversations?.find((conversation) => conversation.id === props.conversationId);
  const isCompact = width < 360 || height < 700;
  const isTiny = width < 340 || height < 620;
  const canSend = (props.inputValue.trim().length > 0 || attachments.length > 0) && props.isSending !== true;
  const traceState = useMemo(() => getTraceState(props.isSending), [props.isSending]);
  const listPaddingBottom = Math.max(bottomAreaHeight + 24, isCompact ? 148 : 190);

  const handleSendPress = () => {
    if (props.isSending) {
      props.onCancel?.();
      return;
    }

    if (canSend) {
      props.onSend();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {props.isSending ? (
        <View style={styles.dynamicIsland}>
          <View style={styles.islandContent}>
            <View style={styles.islandDot} />
            <Text style={styles.islandText}>Agent 思考中</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDrawerOpen(true)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedIconButton]}
        >
          <Text style={styles.iconText}>=</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>{activeConversation?.title ?? "Agent Chat"}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={props.onCreateConversation}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedIconButton]}
        >
          <PlusIcon />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          isCompact && styles.listContentCompact,
          { paddingBottom: listPaddingBottom }
        ]}
        data={[...props.messages]}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(message) => message.id}
        ListEmptyComponent={<EmptyState onPrompt={props.onInputChange} />}
        renderItem={({ item }) => <MessageBubble message={item} showStreaming={props.isSending === true} />}
      />

      <View
        onLayout={(event) => setBottomAreaHeight(Math.ceil(event.nativeEvent.layout.height))}
        style={[styles.bottomArea, isCompact && styles.bottomAreaCompact]}
      >
        {traceState !== undefined && !isTiny ? <AgentTraceCard traceState={traceState} compact={isCompact} /> : null}
        {!isTiny ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickTools}
            contentContainerStyle={styles.quickToolsContent}
          >
            {quickPrompts.map((prompt) => (
              <Pressable
                accessibilityRole="button"
                key={prompt.label}
                onPress={() => props.onInputChange(prompt.label)}
                style={({ pressed }) => [
                  styles.toolChip,
                  isCompact && styles.toolChipCompact,
                  pressed && styles.toolChipPressed
                ]}
              >
                <Text style={styles.toolChipIcon}>{prompt.icon}</Text>
                <Text style={[styles.toolChipText, isCompact && styles.toolChipTextCompact]}>{prompt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.inputBar}>
          <Pressable
            accessibilityRole="button"
            onPress={props.onPickAttachments}
            style={({ pressed }) => [styles.attachButton, pressed && styles.smallButtonPressed]}
          >
            <PaperclipIcon />
          </Pressable>
          <TextInput
            multiline
            onChangeText={props.onInputChange}
            placeholder={isCompact ? "输入消息" : "输入消息，Shift + Enter 换行"}
            placeholderTextColor="#80868b"
            style={[styles.input, isCompact && styles.inputCompact]}
            value={props.inputValue}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!props.isSending && !canSend}
            onPress={handleSendPress}
            style={({ pressed }) => [
              styles.sendButton,
              !props.isSending && !canSend && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed
            ]}
          >
            {props.isSending ? <StopIcon /> : <SendIcon />}
          </Pressable>
        </View>
        {attachments.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.attachmentRail}
            contentContainerStyle={styles.attachmentRailContent}
          >
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentChip}>
                <Text numberOfLines={1} style={styles.attachmentName}>{attachment.name}</Text>
                <Pressable
                  accessibilityLabel={`移除 ${attachment.name}`}
                  accessibilityRole="button"
                  onPress={() => props.onAttachmentsChange?.(attachments.filter((current) => current.id !== attachment.id))}
                  style={styles.removeAttachmentButton}
                >
                  <Text style={styles.removeAttachmentText}>x</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <HistoryDrawer
        activeConversationId={props.conversationId}
        conversations={props.conversations ?? []}
        onCreateConversation={props.onCreateConversation}
        onClose={() => setDrawerOpen(false)}
        onSelectConversation={props.onSelectConversation}
        open={drawerOpen}
      />
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, showStreaming }: { message: ChatMessage; showStreaming: boolean }): ReactElement {
  const isUser = message.role === "user";
  const showTyping = showStreaming && message.role === "assistant" && message.status === "streaming";

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        ) : null}
        <View style={styles.bubbleContent}>
          {!isUser ? <Text style={styles.senderName}>智能助手</Text> : null}
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            {isUser ? (
              <Text style={styles.userContent}>{message.content}</Text>
            ) : message.content.length > 0 ? (
              <Markdown style={markdownStyles}>{message.content}</Markdown>
            ) : (
              <TypingIndicator />
            )}
          </View>
          {message.toolCalls.length > 0 ? <ToolTracePanel toolCalls={message.toolCalls} /> : null}
          {showTyping ? <TypingIndicator /> : null}
          {message.status === "failed" ? <StatusPill tone="danger" text={message.error ?? "生成失败"} /> : null}
          {message.status === "cancelled" ? <StatusPill tone="muted" text="已停止" /> : null}
        </View>
      </View>
    </View>
  );
}

function AgentTraceCard({ compact, traceState }: { compact?: boolean; traceState: TraceState }): ReactElement {
  return (
    <View style={styles.agentTrace}>
      <View style={[styles.traceHeader, compact && styles.traceHeaderCompact]}>
        <View style={styles.traceStatus}>
          <View style={[styles.statusDot, styles.statusDotRunning]} />
          <Text style={styles.traceHeaderText}>Agent 执行中</Text>
        </View>
        <Text style={styles.traceMeta}>{traceState.steps.length} steps</Text>
      </View>
      <View style={[styles.traceBody, compact && styles.traceBodyCompact]}>
        {traceState.steps.map((step) => (
          <View key={step.title} style={[styles.traceNode, step.active && styles.traceNodeActive]}>
            <Text style={[styles.nodeIcon, step.active && styles.nodeIconActive]}>{step.active ? ">" : "."}</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{step.title}</Text>
              <Text style={styles.nodeDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ToolTracePanel({ toolCalls }: { toolCalls: readonly ToolCall[] }): ReactElement {
  return (
    <View style={styles.agentTrace}>
      <View style={styles.traceHeader}>
        <View style={styles.traceStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.traceHeaderText}>工具调用</Text>
        </View>
        <Text style={styles.traceMeta}>{toolCalls.length}</Text>
      </View>
      <View style={styles.traceBody}>
        {toolCalls.map((toolCall) => (
          <View key={toolCall.id} style={[styles.traceNode, styles.traceNodeActive]}>
            <Text style={styles.nodeIcon}>{getToolStatusIcon(toolCall.status)}</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{toolCall.name}</Text>
              <Text style={styles.nodeDesc}>{toolCall.error ?? toolCall.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyState({ onPrompt }: { onPrompt(prompt: string): void }): ReactElement {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>开始一次移动端 Agent 协作</Text>
      <Text style={styles.emptyCopy}>消息流、Trace、快捷输入和发送状态都在这里实时展示。</Text>
      <Pressable onPress={() => onPrompt("帮我审查这版移动端体验")} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>填入示例需求</Text>
      </Pressable>
    </View>
  );
}

function TypingIndicator(): ReactElement {
  return (
    <View style={styles.typingIndicator}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  );
}

function StatusPill({ text, tone }: { text: string; tone: "danger" | "muted" }): ReactElement {
  return (
    <View style={[styles.statusPill, tone === "danger" ? styles.statusPillDanger : styles.statusPillMuted]}>
      <Text style={[styles.statusPillText, tone === "danger" ? styles.statusPillTextDanger : styles.statusPillTextMuted]}>
        {text}
      </Text>
    </View>
  );
}

function PlusIcon(): ReactElement {
  return (
    <View style={styles.plusIcon}>
      <View style={styles.plusHorizontal} />
      <View style={styles.plusVertical} />
    </View>
  );
}

function PaperclipIcon(): ReactElement {
  return (
    <View style={styles.paperclipOuter}>
      <View style={styles.paperclipInner} />
    </View>
  );
}

function SendIcon(): ReactElement {
  return <View style={styles.sendTriangle} />;
}

function StopIcon(): ReactElement {
  return <View style={styles.stopSquare} />;
}

function HistoryDrawer({
  activeConversationId,
  conversations,
  onClose,
  onCreateConversation,
  onSelectConversation,
  open
}: {
  activeConversationId?: ConversationId;
  conversations: readonly Conversation[];
  open: boolean;
  onClose(): void;
  onCreateConversation?(): void;
  onSelectConversation?(conversationId: ConversationId): void;
}): ReactElement | null {
  const [mounted, setMounted] = useState(open);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
    }

    Animated.timing(progress, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: open ? 1 : 0,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && !open) {
        setMounted(false);
      }
    });
  }, [open, progress]);

  if (!mounted) {
    return null;
  }

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const drawerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 0]
  });

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>对话</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.drawerCloseButton}>
              <Text style={styles.drawerCloseText}>x</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              onCreateConversation?.();
              onClose();
            }}
            style={styles.drawerNewChat}
          >
            <Text style={styles.drawerNewChatText}>新建对话</Text>
          </Pressable>
          {conversations.map((conversation) => (
            <Pressable
              key={conversation.id}
              onPress={() => {
                onSelectConversation?.(conversation.id);
                onClose();
              }}
              style={[styles.historyItem, conversation.id === activeConversationId && styles.historyItemActive]}
            >
              <Text numberOfLines={1} style={styles.historyTitle}>{conversation.title}</Text>
              <Text numberOfLines={1} style={styles.historyDesc}>
                {conversation.messageIds.length} 条消息
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface TraceState {
  steps: Array<{ title: string; desc: string; active?: boolean }>;
}

function getTraceState(isSending?: boolean): TraceState | undefined {
  if (isSending !== true) {
    return undefined;
  }

  return {
    steps: [
      {
        title: "解析上下文",
        desc: "读取当前会话消息与用户意图"
      },
      {
        title: "组织回复",
        desc: isSending === true ? "正在生成可执行结果" : "等待下一次输入",
        active: isSending === true
      }
    ]
  };
}

function getToolStatusIcon(status: ToolCall["status"]): string {
  switch (status) {
    case "done":
      return ".";
    case "failed":
      return "!";
    case "running":
      return ">";
    default:
      return "-";
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
  dynamicIsland: {
    position: "absolute",
    top: 6,
    zIndex: 20,
    elevation: 20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 178,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#000000",
    opacity: 0.96
  },
  islandContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  islandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff"
  },
  islandText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600"
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "rgba(248,249,250,0.96)"
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  pressedIconButton: {
    backgroundColor: "#f1f3f4"
  },
  iconText: {
    color: "#1a1a1a",
    fontSize: 20,
    fontWeight: "700"
  },
  plusIcon: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    position: "relative",
    width: 18
  },
  plusHorizontal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 1,
    height: 2,
    position: "absolute",
    width: 16
  },
  plusVertical: {
    backgroundColor: "#1a1a1a",
    borderRadius: 1,
    height: 16,
    position: "absolute",
    width: 2
  },
  title: {
    flex: 1,
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  listContent: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  listContentCompact: {
    gap: 18,
    paddingHorizontal: 12,
    paddingTop: 12
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%"
  },
  messageRowUser: {
    justifyContent: "flex-end"
  },
  messageContainer: {
    flexDirection: "row",
    gap: 10,
    maxWidth: "90%"
  },
  messageContainerUser: {
    flexDirection: "row-reverse"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    marginTop: 2,
    width: 28
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700"
  },
  bubbleContent: {
    gap: 8,
    minWidth: 0
  },
  senderName: {
    color: "#80868b",
    fontSize: 11
  },
  bubble: {
    maxWidth: "100%"
  },
  userBubble: {
    backgroundColor: "#e8eaed",
    borderBottomRightRadius: 4,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  assistantBubble: {
    backgroundColor: "transparent",
    paddingVertical: 4
  },
  userContent: {
    color: "#1a1a1a",
    fontSize: 15,
    lineHeight: 23
  },
  agentTrace: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    borderRadius: 12,
    backgroundColor: "#ffffff"
  },
  traceHeader: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  traceHeaderCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  traceStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34a853"
  },
  statusDotRunning: {
    backgroundColor: "#4285f4"
  },
  traceHeaderText: {
    color: "#5f6368",
    fontSize: 12,
    fontWeight: "600"
  },
  traceMeta: {
    color: "#80868b",
    fontSize: 11
  },
  traceBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ededed",
    gap: 10,
    padding: 12
  },
  traceBodyCompact: {
    gap: 6,
    padding: 9
  },
  traceNode: {
    flexDirection: "row",
    gap: 8,
    opacity: 0.55
  },
  traceNodeActive: {
    opacity: 1
  },
  nodeIcon: {
    color: "#34a853",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1
  },
  nodeIconActive: {
    color: "#4285f4"
  },
  nodeContent: {
    flex: 1
  },
  nodeTitle: {
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: "700"
  },
  nodeDesc: {
    color: "#80868b",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2
  },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12
  },
  bottomAreaCompact: {
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 8
  },
  quickTools: {
    flexGrow: 0
  },
  quickToolsContent: {
    gap: 8,
    paddingRight: 4
  },
  toolChip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 5
  },
  toolChipCompact: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  toolChipPressed: {
    backgroundColor: "#f4f5f6",
    transform: [{ scale: 0.98 }]
  },
  toolChipIcon: {
    color: "#5f6368",
    fontSize: 12,
    fontWeight: "700"
  },
  toolChipText: {
    color: "#5f6368",
    fontSize: 13
  },
  toolChipTextCompact: {
    fontSize: 12
  },
  inputBar: {
    alignItems: "center",
    backgroundColor: "#f4f5f6",
    borderRadius: 28,
    flexDirection: "row",
    gap: 6,
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  attachButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  paperclipOuter: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#5f6368",
    borderRadius: 9,
    height: 24,
    justifyContent: "center",
    transform: [{ rotate: "-30deg" }],
    width: 14
  },
  paperclipInner: {
    borderWidth: 1.6,
    borderColor: "#5f6368",
    borderRadius: 6,
    height: 14,
    width: 7
  },
  smallButtonPressed: {
    backgroundColor: "#e8eaed"
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 4,
    paddingTop: Platform.OS === "web" ? 9 : 8,
    paddingBottom: Platform.OS === "web" ? 9 : 8,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: "center",
    color: "#1a1a1a"
  },
  inputCompact: {
    fontSize: 14,
    maxHeight: 78
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    alignSelf: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  sendButtonDisabled: {
    opacity: 0.28
  },
  sendButtonPressed: {
    transform: [{ scale: 0.92 }]
  },
  sendTriangle: {
    height: 0,
    width: 0,
    borderBottomWidth: 7,
    borderBottomColor: "transparent",
    borderLeftWidth: 12,
    borderLeftColor: "#ffffff",
    borderTopWidth: 7,
    borderTopColor: "transparent",
    marginLeft: 3
  },
  stopSquare: {
    backgroundColor: "#ffffff",
    borderRadius: 2,
    height: 12,
    width: 12
  },
  attachmentRail: {
    flexGrow: 0
  },
  attachmentRailContent: {
    gap: 8,
    paddingRight: 4
  },
  attachmentChip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    maxWidth: 220,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4
  },
  attachmentName: {
    color: "#5f6368",
    flexShrink: 1,
    fontSize: 12
  },
  removeAttachmentButton: {
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20
  },
  removeAttachmentText: {
    color: "#5f6368",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14
  },
  typingIndicator: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 8
  },
  typingDot: {
    backgroundColor: "#80868b",
    borderRadius: 3,
    height: 5,
    opacity: 0.55,
    width: 5
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  statusPillDanger: {
    backgroundColor: "#fef2f2"
  },
  statusPillMuted: {
    backgroundColor: "#f1f3f4"
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600"
  },
  statusPillTextDanger: {
    color: "#b91c1c"
  },
  statusPillTextMuted: {
    color: "#5f6368"
  },
  emptyState: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    borderRadius: 16,
    gap: 10,
    marginTop: 20,
    padding: 16
  },
  emptyTitle: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700"
  },
  emptyCopy: {
    color: "#5f6368",
    fontSize: 13,
    lineHeight: 19
  },
  emptyButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700"
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  drawer: {
    width: 260,
    height: "100%",
    backgroundColor: "#ffffff",
    paddingTop: 54,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16
  },
  drawerHeader: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ededed",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  drawerTitle: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700"
  },
  drawerCloseButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  drawerCloseText: {
    color: "#5f6368",
    fontSize: 16,
    fontWeight: "700"
  },
  drawerNewChat: {
    backgroundColor: "#f4f5f6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    borderRadius: 12,
    margin: 16,
    padding: 12
  },
  drawerNewChatText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  historyItem: {
    borderRadius: 8,
    gap: 4,
    marginHorizontal: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  historyItemActive: {
    backgroundColor: "#f4f5f6"
  },
  historyTitle: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "700"
  },
  historyDesc: {
    color: "#80868b",
    fontSize: 12
  }
});

const markdownStyles = StyleSheet.create({
  body: {
    color: "#1a1a1a",
    fontSize: 15,
    lineHeight: 23,
    margin: 0
  },
  paragraph: {
    marginBottom: 6,
    marginTop: 0
  },
  code_inline: {
    backgroundColor: "#f1f3f4",
    borderRadius: 4,
    paddingHorizontal: 4
  },
  fence: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    color: "#f9fafb",
    padding: 10
  }
});
