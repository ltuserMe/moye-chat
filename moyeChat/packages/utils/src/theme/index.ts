// ── 系统暗色/亮色模式（纯逻辑，跨平台共享）──

export type ThemeMode = "light" | "dark" | "system";

/** 解析系统偏好：传入 prefers-color-scheme 的值 */
export function resolveThemeMode(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return mode;
}

/**
 * CSS 媒体查询字符串，用于 Web 端监听系统主题变化
 * 用法: window.matchMedia(SYSTEM_DARK_MODE_QUERY)
 */
export const SYSTEM_DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

/** 所有可选模式 */
export const ALL_THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"] as const;

/** 模式中文标签 */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统"
};
