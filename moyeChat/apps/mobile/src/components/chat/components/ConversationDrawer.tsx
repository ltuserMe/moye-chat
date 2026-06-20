import type { Conversation, ConversationId } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";

export function ConversationDrawer({
  activeConversationId,
  conversations,
  open,
  onClose,
  onCreateConversation,
  onSelectConversation
}: {
  activeConversationId?: ConversationId;
  conversations: readonly Conversation[];
  open: boolean;
  onClose(): void;
  onCreateConversation(): void;
  onSelectConversation(conversationId: ConversationId): void;
}): ReactElement {
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

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const drawerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0]
  });

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>会话历史</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              onCreateConversation();
              onClose();
            }}
            style={styles.newChat}
          >
            <Text style={styles.newChatText}>新建对话</Text>
          </Pressable>
          {conversations.map((conversation) => (
            <Pressable
              key={conversation.id}
              onPress={() => {
                onSelectConversation(conversation.id);
                onClose();
              }}
              style={[styles.historyItem, conversation.id === activeConversationId && styles.historyItemActive]}
            >
              <Text numberOfLines={1} style={styles.historyTitle}>{conversation.title}</Text>
              <Text numberOfLines={1} style={styles.historyDesc}>{conversation.messageIds.length} 条消息</Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const DRAWER_WIDTH = 286;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  drawer: {
    backgroundColor: "#ffffff",
    height: "100%",
    paddingTop: 54,
    width: DRAWER_WIDTH
  },
  header: {
    alignItems: "center",
    borderBottomColor: tokens.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg
  },
  title: {
    color: tokens.color.text,
    fontSize: tokens.typography.title.fontSize,
    fontWeight: tokens.typography.title.fontWeight
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  closeText: {
    color: tokens.color.textSecondary,
    fontSize: 16,
    fontWeight: "700"
  },
  newChat: {
    backgroundColor: tokens.color.app,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    margin: tokens.spacing.lg,
    padding: tokens.spacing.md
  },
  newChatText: {
    color: tokens.color.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  historyItem: {
    borderRadius: tokens.radius.sm,
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
    marginHorizontal: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md
  },
  historyItemActive: {
    backgroundColor: tokens.color.app
  },
  historyTitle: {
    color: tokens.color.text,
    fontSize: 14,
    fontWeight: "700"
  },
  historyDesc: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.caption.fontSize
  }
});
