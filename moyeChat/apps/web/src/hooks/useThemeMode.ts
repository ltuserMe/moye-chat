"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  type ThemeMode,
  resolveThemeMode,
  SYSTEM_DARK_MODE_QUERY
} from "@agent-chat/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemePreferenceStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemePreference = create<ThemePreferenceStore>()(
  persist(
    (set) => ({
      mode: "system" as ThemeMode,
      setMode: (mode: ThemeMode) => set({ mode })
    }),
    {
      name: "moye-theme-pref"
    }
  )
);

/**
 * 获取解析后的实际主题 ("light" | "dark")
 *
 * - mode = "system" 时监听 CSS media query
 * - mode = "light" / "dark" 时直接返回
 */
export function useResolvedTheme(): "light" | "dark" {
  const mode = useThemePreference((s) => s.mode);

  const systemPrefersDark = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia(SYSTEM_DARK_MODE_QUERY);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia(SYSTEM_DARK_MODE_QUERY).matches,
    () => false
  );

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
