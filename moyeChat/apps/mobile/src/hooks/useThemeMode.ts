import { useMemo } from 'react';
import {
  type ThemeMode,
  resolveThemeMode
} from '@agent-chat/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 持久化用户手动选择的主题偏好 ──

interface ThemePreferenceStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const useThemePreference = create<ThemePreferenceStore>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode: ThemeMode) => set({ mode })
    }),
    {
      name: 'moye-theme-pref',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ mode: s.mode })
    }
  )
);

/**
 * 获取解析后的主题 ("light" | "dark")
 *
 * mode = "system" 时自动跟随系统配色
 * mode = "light" / "dark" 时手动覆盖
 */
export function useResolvedTheme(): "light" | "dark" {
  const mode = useThemePreference((s) => s.mode);
  const systemScheme = useColorScheme();
  const systemPrefersDark = systemScheme === 'dark';

  return useMemo(
    () => resolveThemeMode(mode, systemPrefersDark),
    [mode, systemPrefersDark]
  );
}

/**
 * 获取主题模式 + 设置方法（供设置页使用）
 */
export function useThemeMode() {
  const mode = useThemePreference((s) => s.mode);
  const setMode = useThemePreference((s) => s.setMode);
  return { mode, setMode } as const;
}
