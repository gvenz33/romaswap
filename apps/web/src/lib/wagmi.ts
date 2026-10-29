import { injected, type CreateConnectorFn } from "@wagmi/core";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
// Direct files, not the wagmi/connectors barrel. That barrel loads Base Account,
// which imports an optional package Next cannot resolve.
// @ts-expect-error Implementation file is shipped without a sibling declaration.
import { coinbaseWallet } from "../../../../node_modules/@wagmi/connectors/dist/esm/coinbaseWallet.js";
// @ts-expect-error Implementation file is shipped without a sibling declaration.
import { walletConnect } from "../../../../node_modules/@wagmi/connectors/dist/esm/walletConnect.js";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";
const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL?.trim() || "https://mainnet.base.org";

const coinbase = coinbaseWallet as (parameters?: { appName?: string }) => CreateConnectorFn;
const connectWallet = walletConnect as (parameters: {
  projectId: string;
  showQrModal?: boolean;
  metadata: { name: string; description: string; url: string; icons: string[] };
}) => CreateConnectorFn;

export const wagmiConfig = createConfig({
  chains: [base],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(rpcUrl),
  },
  connectors: [
    injected({ shimDisconnect: true }),
    coinbase({ appName: "RomaSwap" }),
    ...(projectId
      ? [
          connectWallet({
            projectId,
            showQrModal: true,
            metadata: {
              name: "RomaSwap",
              description: "Noncustodial swaps on Base",
              url: "https://romaswap.local",
              icons: ["https://romaswap.local/favicon.ico"],
            },
          }),
        ]
      : []),
  ],
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
