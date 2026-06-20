import type { ThemeMode } from "@agent-chat/utils";
import { resolveThemeMode } from "@agent-chat/utils";

export const mobileTokens = {
  color: {
    app: "#f4f5f6",
    chat: "#f8f9fa",
    input: "#ffffff",
    inputMuted: "#f4f5f6",
    border: "#ededed",
    text: "#1a1a1a",
    textSecondary: "#5f6368",
    textMuted: "#80868b",
    accent: "#000000",
    userBubble: "#e8eaed",
    danger: "#b91c1c",
    dangerBg: "#fef2f2",
    traceProgress: "#4285f4",
    traceSuccess: "#34a853"
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999
  },
  shadow: {
    bottom: {
      elevation: 12,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 24
    }
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
  },
  typography: {
    title: { fontSize: 16, fontWeight: "700" as const },
    body: { fontSize: 15, lineHeight: 23 },
    caption: { fontSize: 12 },
    small: { fontSize: 11 }
  }
};

/** 暗色模式 Token */
export const darkTokens = {
  ...mobileTokens,
  color: {
    ...mobileTokens.color,
    app: "#111111",
    chat: "#1a1a1a",
    input: "#2a2a2a",
    inputMuted: "#222222",
    border: "#333333",
    text: "#e5e5e5",
    textSecondary: "#999999",
    textMuted: "#666666",
    accent: "#ffffff",
    userBubble: "#2a2a2a",
    dangerBg: "#2d1b1b"
  },
  shadow: {
    bottom: {
      elevation: 12,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 24
    }
  }
};

/**
 * 根据系统暗色偏好解析主题 Token
 */
export function resolveTokens(systemPrefersDark: boolean) {
  return systemPrefersDark ? darkTokens : mobileTokens;
}
