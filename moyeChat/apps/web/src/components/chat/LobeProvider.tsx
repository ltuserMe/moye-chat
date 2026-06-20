"use client";

import { ConfigProvider, ThemeProvider } from "@lobehub/ui";
import { motion } from "motion/react";
import { useEffect, useState, type PropsWithChildren } from "react";

export function LobeProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ConfigProvider motion={motion}>
      <ThemeProvider>{children}</ThemeProvider>
    </ConfigProvider>
  );
}
