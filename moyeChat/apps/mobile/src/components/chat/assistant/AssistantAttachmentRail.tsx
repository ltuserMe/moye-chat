import type { ChatAttachment } from "@agent-chat/chat-core";
import { isImage, formatFileSize, getFileIconSvg } from "@agent-chat/utils";
import type { ReactElement } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { mobileTokens as t } from "@/components/chat/theme/tokens";

export function AssistantAttachmentRail({
  attachments,
  onChange
}: {
  attachments: readonly ChatAttachment[];
  onChange(attachments: readonly ChatAttachment[]): void;
}): ReactElement | null {
  if (attachments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.rail}
      contentContainerStyle={s.content}
    >
      {attachments.map((attachment) => {
        const isImg = isImage(attachment.mimeType);
        const iconUri = isImg ? null : getFileIconSvg(attachment.mimeType);
        const handleRemove = () => onChange(attachments.filter((a) => a.id !== attachment.id));

        if (isImg) {
          return (
            <View key={attachment.id} style={s.imageCard}>
              {attachment.url ? (
                <Image source={{ uri: attachment.url }} style={s.thumbnail} />
              ) : (
                <View style={s.imagePlaceholder} />
              )}
              <Pressable
                onPress={handleRemove}
                style={({ pressed }) => [s.removeBtn, pressed && { opacity: 0.6 }]}
              >
                <X size={10} color="#fff" strokeWidth={3} />
              </Pressable>
            </View>
          );
        }

        return (
          <View key={attachment.id} style={s.fileCard}>
            {iconUri ? (
              <Image source={{ uri: iconUri }} style={s.fileIcon} />
            ) : (
              <View style={s.fileIconPlaceholder} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={s.name}>{attachment.name}</Text>
              {attachment.size != null ? (
                <Text style={s.size}>{formatFileSize(attachment.size)}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={handleRemove}
              style={({ pressed }) => [s.removeSmall, pressed && { opacity: 0.5 }]}
            >
              <X size={12} color={t.color.textMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  rail: { flexGrow: 0 },
  content: { gap: t.spacing.sm, paddingHorizontal: t.spacing.sm, paddingBottom: t.spacing.sm },
  imageCard: { width: 64, height: 64, borderRadius: 8, overflow: "hidden" as const, flexShrink: 0 },
  thumbnail: { width: "100%" as const, height: "100%" as const },
  imagePlaceholder: { width: "100%" as const, height: "100%" as const, backgroundColor: t.color.inputMuted, alignItems: "center" as const, justifyContent: "center" as const },
  fileIcon: { width: 32, height: 32, flexShrink: 0 },
  fileIconPlaceholder: { width: 32, height: 32, flexShrink: 0, borderRadius: 6, backgroundColor: t.color.inputMuted },
  removeBtn: { position: "absolute" as const, top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, width: 16, height: 16, alignItems: "center" as const, justifyContent: "center" as const },
  fileCard: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: t.color.input, maxWidth: 200, flexShrink: 0 },
  name: { color: t.color.text, fontSize: 12, fontWeight: "500" as const },
  size: { color: t.color.textMuted, fontSize: 10, marginTop: 1 },
  removeSmall: { padding: 2 }
});
