"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, cookieToInitialState, type State } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

function normalizeCookie(cookie: string | null): string | undefined {
  if (!cookie) return undefined;
  try {
    return decodeURIComponent(cookie);
  } catch {
    return cookie;
  }
}

export function Providers({ children, cookie }: { children: React.ReactNode; cookie: string | null }) {
  const [queryClient] = useState(() => new QueryClient());
  let initialState: State | undefined;
  try {
    initialState = cookieToInitialState(wagmiConfig, normalizeCookie(cookie));
  } catch {
    initialState = undefined;
  }
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
