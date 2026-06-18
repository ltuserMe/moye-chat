"use client";

import { ConfigProvider, ThemeProvider } from "@lobehub/ui";
import { motion } from "motion/react";
import type { PropsWithChildren } from "react";

export function LobeProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider motion={motion}>
      <ThemeProvider>{children}</ThemeProvider>
    </ConfigProvider>
  );
}
