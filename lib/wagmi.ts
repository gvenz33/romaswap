import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { base } from "viem/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
import { BASE_CHAIN_ID } from "@/lib/config";

if (base.id !== BASE_CHAIN_ID) {
  throw new Error("RomaSwap only runs on Base, chain ID 8453.");
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";
export const walletConnectReady = projectId.length > 0;

const appUrl = "https://romaswap.vercel.app";

function createRomaConfig() {
  return createConfig({
    chains: [base],
    ssr: true,
    multiInjectedProviderDiscovery: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [base.id]: http("https://mainnet.base.org"),
    },
    connectors: [
      metaMask(),
      coinbaseWallet({
        appName: "RomaSwap",
        appLogoUrl: `${appUrl}/emblem.png`,
        preference: { options: "all" },
      }),
      ...(walletConnectReady
        ? [
            walletConnect({
              projectId,
              showQrModal: true,
              metadata: {
                name: "RomaSwap",
                description: "Swap tokens on Base. Sample quotes only.",
                url: appUrl,
                icons: [`${appUrl}/emblem.png`],
              },
            }),
          ]
        : []),
    ],
  });
}

type RomaConfig = ReturnType<typeof createRomaConfig>;

let config: RomaConfig | undefined;

export function getConfig(): RomaConfig {
  if (!config) config = createRomaConfig();
  return config;
}
