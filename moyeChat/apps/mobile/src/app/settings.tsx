import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokens } from '@/theme/tokens';

export default function SettingsScreen(): ReactElement {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.section}>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.description}>模型、语音、上传和隐私配置入口已预留。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: tokens.color.chat,
    flex: 1
  },
  section: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg
  },
  title: {
    color: tokens.color.text,
    fontSize: tokens.typography.title.fontSize,
    fontWeight: tokens.typography.title.fontWeight
  },
  description: {
    color: tokens.color.textSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: 22
  }
});
