"use client";

import { LobeProvider } from "@/components/chat";
import type { PropsWithChildren } from "react";

export function AppProviders({ children }: PropsWithChildren) {
  return <LobeProvider>{children}</LobeProvider>;
}
