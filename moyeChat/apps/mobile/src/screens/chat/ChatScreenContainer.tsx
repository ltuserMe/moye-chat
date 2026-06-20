import type { ConversationId } from '@agent-chat/chat-core';
import { ChatScreenView } from '@/components/chat';
import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatController } from '@/hooks/useChatController';
import { useUiStore } from '@/stores/ui-store';
import { tokens } from '@/theme/tokens';

export function ChatScreenContainer({
  conversationId
}: {
  conversationId?: ConversationId;
}): ReactElement {
  const chat = useChatController(conversationId);
  const globalError = useUiStore((state) => state.globalError);
  const isOffline = useUiStore((state) => state.isOffline);
  const isScreenLoading = useUiStore((state) => state.isScreenLoading);
  const setGlobalError = useUiStore((state) => state.setGlobalError);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <ChatScreenView {...chat} />
      {isOffline ? <StatusBanner tone="warning" label="当前离线，消息会等待重试。" /> : null}
      {globalError ? (
        <StatusBanner
          actionLabel="知道了"
          label={globalError}
          onAction={() => setGlobalError(undefined)}
          tone="error"
        />
      ) : null}
      {isScreenLoading ? (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator color={tokens.color.accent} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function StatusBanner({
  actionLabel,
  label,
  tone,
  onAction
}: {
  actionLabel?: string;
  label: string;
  tone: 'error' | 'warning';
  onAction?(): void;
}): ReactElement {
  return (
    <View style={[styles.banner, tone === 'error' ? styles.errorBanner : styles.warningBanner]}>
      <Text numberOfLines={2} style={styles.bannerText}>{label}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  banner: {
    alignItems: 'center',
    borderRadius: tokens.radius.md,
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    left: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    position: 'absolute',
    right: tokens.spacing.md,
    top: tokens.spacing.md
  },
  errorBanner: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffccc7',
    borderWidth: StyleSheet.hairlineWidth
  },
  warningBanner: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: StyleSheet.hairlineWidth
  },
  bannerText: {
    color: tokens.color.text,
    flex: 1,
    fontSize: tokens.typography.caption.fontSize
  },
  bannerButton: {
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4
  },
  bannerButtonText: {
    color: tokens.color.accent,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600'
  }
});
