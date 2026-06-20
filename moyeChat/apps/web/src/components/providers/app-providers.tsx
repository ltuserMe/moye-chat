"use client";

import { LobeProvider } from "@/components/chat";
import { useResolvedTheme } from "@/hooks/useThemeMode";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

export function AppProviders({ children }: PropsWithChildren) {
  const resolved = useResolvedTheme();

  // 在 <html> 上设置 data-theme 属性用于 CSS 变量切换
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  return (
    <LobeProvider themeMode={resolved}>{children}</LobeProvider>
  );
}
