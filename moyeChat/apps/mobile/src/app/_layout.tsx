import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useResolvedTheme } from '@/hooks/useThemeMode';

export default function TabLayout() {
  const resolved = useResolvedTheme();

  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="chat/[conversationId]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="attachments/[id]" />
      </Stack>
    </ThemeProvider>
  );
}
