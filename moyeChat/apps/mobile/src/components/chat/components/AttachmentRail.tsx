import type { ChatAttachment } from "@agent-chat/chat-core";
import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";

export function AttachmentRail({
  attachments,
  onChange
}: {
  attachments: readonly ChatAttachment[];
  onChange(attachments: readonly ChatAttachment[]): void;
}): ReactElement | null {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail} contentContainerStyle={styles.content}>
      {attachments.map((attachment) => (
        <View key={attachment.id} style={styles.chip}>
          <Text numberOfLines={1} style={styles.name}>{attachment.name}</Text>
          <Pressable
            accessibilityLabel={`移除 ${attachment.name}`}
            accessibilityRole="button"
            onPress={() => onChange(attachments.filter((current) => current.id !== attachment.id))}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>x</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexGrow: 0
  },
  content: {
    gap: tokens.spacing.sm,
    paddingRight: tokens.spacing.xs
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
    maxWidth: 220,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4
  },
  name: {
    color: tokens.color.textSecondary,
    flexShrink: 1,
    fontSize: tokens.typography.caption.fontSize
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20
  },
  removeText: {
    color: tokens.color.textSecondary,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: "700",
    lineHeight: 14
  }
});
