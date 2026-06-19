import { Camera, Database, FileText, Image } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";
import type { ComposerAction, ComposerActionId } from "../types";

const iconMap = {
  camera: Camera,
  database: Database,
  file: FileText,
  image: Image
} satisfies Record<ComposerActionId, typeof Camera>;

export function ActionPanel({
  actions,
  compact,
  open,
  onAction
}: {
  actions: readonly ComposerAction[];
  compact?: boolean;
  open: boolean;
  onAction(actionId: ComposerActionId): void;
}): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      {actions.map((action) => {
        const Icon = iconMap[action.id];
        return (
          <Pressable
            accessibilityRole="button"
            key={action.id}
            onPress={() => onAction(action.id)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={styles.iconWrapper}>
              <Icon color={tokens.color.text} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopColor: tokens.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
    justifyContent: "space-between",
    paddingBottom: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingTop: tokens.spacing.md
  },
  panelCompact: {
    paddingTop: 10
  },
  item: {
    alignItems: "center",
    gap: 6,
    width: "23%"
  },
  itemPressed: {
    opacity: 0.78
  },
  iconWrapper: {
    alignItems: "center",
    backgroundColor: tokens.color.inputMuted,
    borderRadius: tokens.radius.lg,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  label: {
    color: tokens.color.textSecondary,
    fontSize: tokens.typography.small.fontSize
  }
});
