"use client";

import { useMemo } from "react";
import { erc20Abi, formatUnits, getAddress, type Address } from "viem";
import { useBalance, useReadContracts } from "wagmi";
import { BASE_CHAIN_ID } from "@/lib/config";
import type { Token } from "@/lib/tokens";

export function useBaseBalances(address: Address | undefined, enabled: boolean, tracked: readonly Token[]) {
  const roster = tracked.map((token) => `${token.id}:${token.address ?? ""}:${token.decimals}`).join("|");
  const erc20Tokens = useMemo(
    () =>
      tracked.flatMap((token) => {
        if (!token.address) return [];
        return [{ id: token.id, decimals: token.decimals, address: getAddress(token.address) }];
      }),
    [roster, tracked],
  );

  const native = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    query: { enabled: Boolean(address) && enabled },
  });

  const tokens = useReadContracts({
    chainId: BASE_CHAIN_ID,
    contracts: address
      ? erc20Tokens.map((token) => ({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address] as const,
        }))
      : [],
    query: { enabled: Boolean(address) && enabled },
  });

  const balances = useMemo(() => {
    const next: Record<string, number> = {};
    for (const token of tracked) next[token.id] = 0;
    if (!enabled) return next;
    if (native.data) next.eth = Number(formatUnits(native.data.value, native.data.decimals));
    erc20Tokens.forEach((token, index) => {
      const result = tokens.data?.[index];
      if (result?.status === "success" && typeof result.result === "bigint") {
        next[token.id] = Number(formatUnits(result.result, token.decimals));
      }
    });
    return next;
  }, [enabled, erc20Tokens, native.data, tokens.data, tracked]);

  const failed = enabled && (native.isError || Boolean(tokens.isError));

  return {
    balances,
    loading: enabled && (native.isLoading || tokens.isLoading),
    failed,
  };
}
