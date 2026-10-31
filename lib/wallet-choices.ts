export type ConnectorInfo = {
  id: string;
  name: string;
  type: string;
  icon?: string;
};

export type WalletChoice = {
  id: string;
  name: string;
  detail: string;
  icon?: string;
  ready: boolean;
};

const RANK: Record<string, number> = {
  metamask: 0,
  "coinbase wallet": 1,
  walletconnect: 2,
};

function detailFor(connector: ConnectorInfo): string {
  const name = connector.name.toLowerCase();
  if (name === "metamask" || connector.type === "metaMask") return "Extension or QR code";
  if (name.includes("coinbase") || connector.type === "coinbaseWallet") return "Extension, mobile, or smart wallet";
  if (name === "walletconnect" || connector.type === "walletConnect") {
    return "Trust, Rainbow, Phantom, Rabby, OKX, and other mobile wallets";
  }
  return "Installed in this browser";
}

function safeIcon(icon?: string): string | undefined {
  if (!icon) return undefined;
  if (icon.startsWith("data:image/") || icon.startsWith("https://")) return icon;
  return undefined;
}

export function walletChoices(connectors: readonly ConnectorInfo[], walletConnectReady: boolean): WalletChoice[] {
  const dedicated = connectors.filter((connector) => connector.type !== "injected");
  const covered = new Set(dedicated.map((connector) => connector.name.toLowerCase()));
  const injected = connectors.filter(
    (connector) => connector.type === "injected" && !covered.has(connector.name.toLowerCase()),
  );
  const seen = new Set<string>();
  const unique = [...dedicated, ...injected].filter((connector) => {
    const key = connector.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((left, right) => {
    const leftRank = RANK[left.name.toLowerCase()] ?? 50;
    const rightRank = RANK[right.name.toLowerCase()] ?? 50;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.name.localeCompare(right.name);
  });

  const choices: WalletChoice[] = unique.map((connector) => ({
    id: connector.id,
    name: connector.name,
    detail: detailFor(connector),
    icon: safeIcon(connector.icon),
    ready: true,
  }));

  if (!walletConnectReady && !choices.some((choice) => choice.name.toLowerCase() === "walletconnect")) {
    choices.push({
      id: "walletconnect-unavailable",
      name: "WalletConnect",
      detail: "Trust, Rainbow, and other mobile wallets. Add a project ID to enable the QR code.",
      ready: false,
    });
    choices.sort((left, right) => {
      const leftRank = RANK[left.name.toLowerCase()] ?? 50;
      const rightRank = RANK[right.name.toLowerCase()] ?? 50;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.name.localeCompare(right.name);
    });
  }

  return choices;
}
