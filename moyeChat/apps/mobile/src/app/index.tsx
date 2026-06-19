import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ensureConversation } from '@/controllers/chat-controller';
import { tokens } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const conversationId = ensureConversation();
    router.replace({
      pathname: '/chat/[conversationId]',
      params: { conversationId }
    });
  }, [router]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={tokens.color.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: tokens.color.chat,
    flex: 1,
    justifyContent: 'center'
  }
});
