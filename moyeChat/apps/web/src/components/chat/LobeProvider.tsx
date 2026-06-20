"use client";

import { ConfigProvider, ThemeProvider } from "@lobehub/ui";
import { motion } from "motion/react";
import { useEffect, useState, type PropsWithChildren } from "react";

export function LobeProvider({
  children,
  themeMode = "light"
}: PropsWithChildren<{ themeMode?: "light" | "dark" }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ConfigProvider motion={motion}>
      <ThemeProvider appearance={themeMode}>{children}</ThemeProvider>
    </ConfigProvider>
  );
}
