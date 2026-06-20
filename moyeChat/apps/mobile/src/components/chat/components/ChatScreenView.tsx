import { Menu, Plus } from "lucide-react-native";
import type { ReactElement } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";
import type { ChatScreenViewProps, ComposerAction } from "../types";
import { ConversationDrawer } from "./ConversationDrawer";
import { AssistantThread } from "../assistant/AssistantThread";
import { AssistantComposer } from "../assistant/AssistantComposer";

const composerActions: readonly ComposerAction[] = [
  { id: "camera", label: "拍摄" },
  { id: "image", label: "相册" },
  { id: "file", label: "文件" }
];

/**
 * ChatScreen 纯布局组件
 *
 * assistant-ui 负责:  Thread (消息列表) + Composer (输入区)
 * 自定义组件保持:  Header, Dynamic Island, ConversationDrawer
 *
 * 无业务逻辑 — 所有状态/回调通过 props 传入
 */
export function ChatScreenView(props: ChatScreenViewProps): ReactElement {
  const activeConversation = props.conversations.find(
    (c) => c.id === props.activeConversationId
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {/* Dynamic Island — AI 思考中 */}
      {props.isSending ? (
        <View style={styles.dynamicIsland}>
          <View style={styles.islandDot} />
          <Text style={styles.islandText}>Agent 思考中</Text>
        </View>
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={props.onDrawerOpen}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed
          ]}
        >
          <Menu color={tokens.color.text} size={20} strokeWidth={2.2} />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
          {activeConversation?.title ?? "Agent Chat"}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={props.onCreateConversation}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed
          ]}
        >
          <Plus color={tokens.color.text} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* 消息列表 — assistant-ui ThreadPrimitive */}
      <AssistantThread
        bottomPadding={props.listBottomPadding}
        isSending={props.isSending === true}
        onExamplePrompt={props.onInputChange}
      />

      {/* 底部输入区 — assistant-ui ComposerPrimitive */}
      <View
        onLayout={(event) =>
          props.onBottomLayout(Math.ceil(event.nativeEvent.layout.height))
        }
        style={[
          styles.bottomArea,
          props.isCompact && styles.bottomAreaCompact
        ]}
      >
        <AssistantComposer
          actionPanelOpen={props.actionPanelOpen}
          actions={composerActions}
          attachments={props.attachments}
          compact={props.isCompact}
          isSending={props.isSending}
          isTiny={props.isTiny}
          quickPrompts={props.quickPrompts}
          onAction={props.onComposerAction}
          onActionPanelToggle={props.onActionPanelToggle}
          onAttachmentsChange={props.onAttachmentsChange}
          onMicPress={props.onMicPress}
        />
      </View>

      {/* 对话抽屉 — 自定义组件保持不变 */}
      <ConversationDrawer
        activeConversationId={props.activeConversationId}
        conversations={props.conversations}
        onClose={props.onDrawerClose}
        onCreateConversation={props.onCreateConversation}
        onSelectConversation={props.onSelectConversation}
        open={props.isDrawerOpen}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: tokens.color.chat,
    flex: 1
  },
  dynamicIsland: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    elevation: 20,
    flexDirection: "row",
    gap: 6,
    height: 34,
    justifyContent: "center",
    opacity: 0.96,
    position: "absolute",
    top: 6,
    width: 178,
    zIndex: 20
  },
  islandDot: {
    backgroundColor: "#ffffff",
    borderRadius: 3,
    height: 6,
    width: 6
  },
  islandText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600"
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(248,249,250,0.96)",
    borderBottomColor: "rgba(0,0,0,0.05)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: tokens.spacing.lg
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  iconButtonPressed: {
    backgroundColor: "#f1f3f4"
  },
  title: {
    color: tokens.color.text,
    flex: 1,
    fontSize: tokens.typography.title.fontSize,
    fontWeight: tokens.typography.title.fontWeight,
    textAlign: "center"
  },
  bottomArea: {
    ...tokens.shadow.bottom,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0
  },
  bottomAreaCompact: {
    /* AssistantComposer 内部处理 compact 样式 */
  }
});
