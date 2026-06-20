import type { Conversation, ConversationId } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { ChevronLeft, MoreHorizontal } from "lucide-react-native";

import { mobileTokens as tokens } from "../theme/tokens";

export function ConversationDrawer({
  activeConversationId,
  conversations,
  open,
  onClose,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation
}: {
  activeConversationId?: ConversationId;
  conversations: readonly Conversation[];
  open: boolean;
  onClose(): void;
  onCreateConversation(): void;
  onSelectConversation(conversationId: ConversationId): void;
  onDeleteConversation?(conversationId: ConversationId): void;
  onRenameConversation?(conversationId: ConversationId, title: string): void;
}): ReactElement {
  const [mounted, setMounted] = useState(open);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  // 编辑状态
  const [editingId, setEditingId] = useState<ConversationId | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  // 菜单状态
  const [menuId, setMenuId] = useState<ConversationId | null>(null);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(progress, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: open ? 1 : 0,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
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

  const handleSelect = (id: ConversationId) => {
    setMenuId(null);
    onSelectConversation(id);
    onClose();
  };

  const handleMenuPress = (id: ConversationId) => {
    setMenuId(menuId === id ? null : id);
  };

  const handleRename = (id: ConversationId) => {
    setMenuId(null);
    const conv = conversations.find((c) => c.id === id);
    setEditingId(id);
    setDraftTitle(conv?.title ?? "");
  };

  const submitRename = () => {
    if (editingId && draftTitle.trim().length > 0) {
      onRenameConversation?.(editingId, draftTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: ConversationId, title: string) => {
    setMenuId(null);
    Alert.alert("删除对话", `确定删除「${title}」？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => onDeleteConversation?.(id)
      }
    ]);
  };

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}
        >
          {/* 品牌区 — 对齐 Web 侧边栏 */}
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>M</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>Moye Agent</Text>
                <Text style={styles.brandMeta}>智能工作台</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <ChevronLeft size={20} color={tokens.color.text} strokeWidth={2} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => { onCreateConversation(); onClose(); }}
            style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}
          >
            <Text style={styles.newChatText}>新建对话</Text>
          </Pressable>

          {conversations.map((conversation) => (
            <View
              key={conversation.id}
              style={[
                styles.historyItem,
                conversation.id === activeConversationId && styles.historyItemActive
              ]}
            >
              {/* 点击区域 */}
              <Pressable
                onPress={() => handleSelect(conversation.id)}
                onLongPress={() => handleMenuPress(conversation.id)}
                style={({ pressed }) => [{ flex: 1 }, pressed && styles.pressed]}
              >
                {editingId === conversation.id ? (
                  <TextInput
                    autoFocus
                    value={draftTitle}
                    onChangeText={setDraftTitle}
                    onSubmitEditing={submitRename}
                    onBlur={submitRename}
                    style={styles.editInput}
                  />
                ) : (
                  <>
                    <Text numberOfLines={1} style={styles.historyTitle}>
                      {conversation.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.historyDesc}>
                      {conversation.messageIds.length} 条消息
                    </Text>
                  </>
                )}
              </Pressable>

              {/* ... 按钮 */}
              <Pressable
                onPress={() => handleMenuPress(conversation.id)}
                style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
                hitSlop={8}
              >
                <MoreHorizontal size={16} color={tokens.color.textMuted} strokeWidth={2} />
              </Pressable>

              {/* 下拉菜单 */}
              {menuId === conversation.id ? (
                <View style={styles.dropdown}>
                  <Pressable
                    onPress={() => handleRename(conversation.id)}
                    style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
                  >
                    <Text style={styles.dropdownText}>重命名</Text>
                  </Pressable>
                  <View style={styles.dropdownDivider} />
                  <Pressable
                    onPress={() => handleDelete(conversation.id, conversation.title)}
                    style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
                  >
                    <Text style={styles.dropdownTextDanger}>删除</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
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
    alignItems: "center" as const,
    borderBottomColor: tokens.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg
  },
  // 品牌区
  brand: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
    gap: 12
  },
  brandMark: {
    alignItems: "center" as const,
    backgroundColor: tokens.color.accent,
    borderRadius: 10,
    height: 38,
    justifyContent: "center" as const,
    width: 38
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800" as const
  },
  brandTitle: {
    color: tokens.color.text,
    fontSize: 16,
    fontWeight: "700" as const
  },
  brandMeta: {
    color: tokens.color.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  // 关闭按钮
  closeButton: {
    alignItems: "center" as const,
    borderRadius: 18,
    height: 36,
    justifyContent: "center" as const,
    width: 36
  },
  // 通用按压效果
  pressed: {
    opacity: 0.5
  },
  // 新建按钮
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
    fontWeight: "700" as const,
    textAlign: "center" as const
  },
  // 历史项
  historyItem: {
    borderRadius: tokens.radius.sm,
    marginBottom: tokens.spacing.xs,
    marginHorizontal: tokens.spacing.sm,
    paddingLeft: tokens.spacing.lg,
    paddingRight: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    position: "relative" as const
  },
  historyItemActive: {
    backgroundColor: tokens.color.app
  },
  historyTitle: {
    color: tokens.color.text,
    fontSize: 14,
    fontWeight: "700" as const
  },
  historyDesc: {
    color: tokens.color.textMuted,
    fontSize: tokens.typography.caption.fontSize,
    marginTop: 2
  },
  // ... 菜单按钮
  menuBtn: {
    padding: 6,
    borderRadius: 6
  },
  // 下拉菜单
  dropdown: {
    position: "absolute" as const,
    right: 8,
    top: 40,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.color.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
    minWidth: 120
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  dropdownText: {
    fontSize: 14,
    color: tokens.color.text
  },
  dropdownTextDanger: {
    fontSize: 14,
    color: tokens.color.danger
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.border
  },
  editInput: {
    color: tokens.color.text,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.accent,
    paddingVertical: 2
  }
});
