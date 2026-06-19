import { useLocalSearchParams } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokens } from '@/theme/tokens';

export default function AttachmentDetailScreen(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.section}>
        <Text style={styles.title}>附件详情</Text>
        <Text style={styles.description}>{id ?? '未选择附件'}</Text>
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
    fontSize: tokens.typography.body.fontSize
  }
});
