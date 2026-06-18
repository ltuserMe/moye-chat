"use client";

import { LobeProvider } from "@agent-chat/ui-web";
import type { PropsWithChildren } from "react";

export function AppProviders({ children }: PropsWithChildren) {
  return <LobeProvider>{children}</LobeProvider>;
}
