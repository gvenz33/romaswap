"use client";

import { BASE_CHAIN_ID } from "@romaswap/config";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const onBase = chainId === BASE_CHAIN_ID;

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-line px-3 py-1 text-xs text-mute">
          {onBase ? "Base" : "Wrong network"} · {shortAddress(address)}
        </span>
        {!onBase ? (
          <Button size="sm" onClick={() => switchChain({ chainId: BASE_CHAIN_ID })} disabled={switching}>
            {switching ? "Switching…" : "Switch to Base"}
          </Button>
        ) : null}
        <Button size="sm" variant="quiet" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Connect wallet</Button>
      </DialogTrigger>
      <DialogContent title="Connect a wallet">
        <p className="mb-4 text-sm text-mute">
          MetaMask and other injected wallets, Coinbase Wallet, and WalletConnect. RomaSwap never receives your keys.
        </p>
        <ul className="space-y-2">
          {connectors.map((connector) => (
            <li key={connector.uid}>
              <Button
                variant="quiet"
                className="w-full justify-between"
                disabled={isPending}
                onClick={() => {
                  connect(
                    { connector, chainId: BASE_CHAIN_ID },
                    { onSuccess: () => setOpen(false) },
                  );
                }}
              >
                <span>{connector.name}</span>
                <span className="text-xs text-mute">{connector.type}</span>
              </Button>
            </li>
          ))}
        </ul>
        {!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? (
          <p className="mt-4 text-xs text-mute">
            WalletConnect is hidden until NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set.
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-danger">{error.message}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
