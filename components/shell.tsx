"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp, type WalletKind } from "@/components/app-state";
import { Mascot } from "@/components/mascot";
import { TokenIcon } from "@/components/token-icon";
import { formatToken, shortAddress } from "@/lib/format";
import { TOKENS } from "@/lib/tokens";

const TRADE = [
  { href: "/swap", label: "Swap" },
  { href: "/limit", label: "Limit" },
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
];

const EXPLORE = [
  { href: "/explore", label: "Tokens" },
  { href: "/explore/pools", label: "Pools" },
  { href: "/explore/transactions", label: "Transactions" },
  { href: "/explore/auctions", label: "Auctions" },
];

const WALLETS: { kind: WalletKind; name: string; detail: string }[] = [
  { kind: "metamask", name: "MetaMask", detail: "Browser extension" },
  { kind: "coinbase", name: "Coinbase Wallet", detail: "Extension and mobile" },
  { kind: "walletconnect", name: "WalletConnect", detail: "Mobile wallets" },
  { kind: "trust", name: "Trust Wallet", detail: "Mobile wallet" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState<null | "brand" | "trade" | "explore" | "more" | "mobile">(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        app.openModal("search");
      }
      if (event.key === "Escape") {
        app.closeModal();
        app.setNotice(null);
        setMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [app]);

  useEffect(() => {
    setMenu(null);
  }, [pathname]);

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-40 border-b border-[#ffe14a]/50 bg-[#5b21b6]/85 backdrop-blur">
        <div className="flex h-[72px] items-center gap-3 px-3 sm:px-5">
          <div className="relative flex min-w-0 items-center gap-1">
            <button
              className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-white/5"
              aria-expanded={menu === "brand"}
              onClick={() => setMenu(menu === "brand" ? null : "brand")}
            >
              <img src="/emblem.png" alt="" className="h-8 w-8 rounded-full" />
              <span className="hidden text-[17px] font-semibold tracking-tight sm:inline">RomaSwap</span>
              <Caret />
            </button>
            {menu === "brand" ? (
              <MenuCard className="left-0 w-56">
                <Link className="menu-link" href="/swap">Trade</Link>
                <Link className="menu-link" href="/terms">Terms of Service</Link>
                <Link className="menu-link" href="/privacy">Privacy Policy</Link>
              </MenuCard>
            ) : null}
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavDrop
              label="Trade"
              open={menu === "trade"}
              active={["/", "/swap", "/limit", "/buy", "/sell"].includes(pathname)}
              onToggle={() => setMenu(menu === "trade" ? null : "trade")}
              items={TRADE}
            />
            <NavDrop
              label="Explore"
              open={menu === "explore"}
              active={pathname.startsWith("/explore")}
              onToggle={() => setMenu(menu === "explore" ? null : "explore")}
              items={EXPLORE}
            />
            <Link href="/launches" className={navClass(pathname.startsWith("/launches"))}>
              Launches
              <span className="ml-1 rounded-full bg-[#ffe14a]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#ffe14a]">Soon</span>
            </Link>
            <Link href="/pool" className={navClass(pathname.startsWith("/pool"))}>Pool</Link>
            <Link href="/portfolio" className={navClass(pathname.startsWith("/portfolio"))}>Portfolio</Link>
          </nav>

          <button
            className="mx-auto hidden h-10 w-full max-w-[420px] items-center gap-2 rounded-full border border-[#ffe14a]/50 bg-white/15 px-4 text-sm text-[#fff4b8] hover:bg-white/25 md:flex"
            onClick={() => app.openModal("search")}
          >
            <SearchIcon />
            <span className="flex-1 text-left">Search RomaSwap</span>
            <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-xs">/</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5 md:hidden" aria-label="Search RomaSwap" onClick={() => app.openModal("search")}>
              <SearchIcon />
            </button>
            <div className="relative">
              <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5" aria-label="More" onClick={() => setMenu(menu === "more" ? null : "more")}>
                <Dots />
              </button>
              {menu === "more" ? (
                <MenuCard className="right-0 w-64">
                  <Link className="menu-link" href="/terms">Terms of Service</Link>
                  <Link className="menu-link" href="/privacy">Privacy Policy</Link>
                  <p className="px-3 py-2 text-xs leading-5 text-[#f3d4ff]">Demo mode. Sample prices only. Nothing is signed or sent.</p>
                </MenuCard>
              ) : null}
            </div>
            {app.wallet ? (
              <button className="rounded-full border border-[#ffe14a]/50 px-3 py-2 text-sm font-medium text-[#ffe3a3]" aria-label="Disconnect demo wallet" onClick={app.disconnect}>
                {shortAddress(app.wallet.address)}
              </button>
            ) : (
              <button className="rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#1a1408] hover:bg-[#fff3a1]" onClick={() => app.openModal("connect")}>
                Connect
              </button>
            )}
            <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5 lg:hidden" aria-label="Open menu" onClick={() => setMenu(menu === "mobile" ? null : "mobile")}>
              <MenuIcon />
            </button>
          </div>
        </div>
        {menu === "mobile" ? (
          <div className="grid gap-1 border-t border-white/5 px-3 py-3 lg:hidden">
            {[...TRADE, ...EXPLORE, { href: "/launches", label: "Launches" }, { href: "/pool", label: "Pool" }, { href: "/portfolio", label: "Portfolio" }].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">{item.label}</Link>
            ))}
          </div>
        ) : null}
      </header>

      <div className="flex items-center justify-center gap-2 border-b border-[#ffe14a] bg-gradient-to-r from-[#ffe14a] via-[#ff8a3d] to-[#ff4d8d] px-3 py-1 text-center text-xs font-semibold text-[#3b1608] sm:gap-3 sm:text-sm">
        <Mascot pose="wave" alt="" className="h-11 w-11 object-contain" />
        <span>Ave! Demo legion only · sample prices · Base · no signature and no live trade</span>
        <Mascot pose="thumbs" alt="" className="hidden h-11 w-11 object-contain sm:block" />
      </div>

      <div onClick={() => setMenu(null)}>{children}</div>

      {app.modal === "connect" ? <ConnectModal /> : null}
      {app.modal === "search" ? <SearchModal /> : null}
      {app.modal === "token-sell" || app.modal === "token-buy" ? <TokenModal side={app.modal === "token-sell" ? "sell" : "buy"} /> : null}
      {app.modal === "review" ? <ReviewModal /> : null}
      {app.modal === "receipt" ? <ReceiptModal /> : null}
      {app.notice ? <NoticeModal /> : null}
    </div>
  );
}

function navClass(active: boolean) {
  return `rounded-xl px-3 py-2 text-sm ${active ? "text-white" : "text-white/70 hover:text-white"}`;
}

function NavDrop({
  label,
  open,
  active,
  onToggle,
  items,
}: {
  label: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="relative">
      <button className={navClass(active)} aria-expanded={open} onClick={onToggle}>
        {label}
      </button>
      {open ? (
        <MenuCard className="left-0 w-44">
          {items.map((item) => (
            <Link key={item.href} className="menu-link" href={item.href}>{item.label}</Link>
          ))}
        </MenuCard>
      ) : null}
    </div>
  );
}

function MenuCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute top-12 z-50 rounded-2xl border border-[#ffe14a]/40 bg-[#6d28d9] p-2 shadow-2xl ${className ?? ""}`} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  );
}

function ConnectModal() {
  const app = useApp();
  return (
    <Overlay onClose={app.closeModal}>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#6d28d9] p-5">
        <ModalTitle title="Connect a wallet" onClose={app.closeModal} />
        <p className="mb-4 text-sm leading-6 text-[#f3d4ff]">
          This starts a demo session on Base. RomaSwap will not request a signature, a seed phrase, or a transaction.
        </p>
        <div className="grid gap-2">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.kind}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left hover:bg-white/10"
              onClick={() => app.connect(wallet.kind)}
            >
              <span>
                <span className="block font-medium">{wallet.name}</span>
                <span className="text-sm text-[#f3d4ff]">{wallet.detail}</span>
              </span>
              <span className="text-xs font-semibold text-[#ffe14a]">Demo</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[#f3d4ff]">
          <Link className="underline" href="/terms">Terms of Service</Link>
          <span> · </span>
          <Link className="underline" href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </Overlay>
  );
}

function SearchModal() {
  const app = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const pages = [
    { href: "/swap", label: "Swap", hint: "Trade" },
    { href: "/explore", label: "Explore tokens", hint: "Explore" },
    { href: "/pool", label: "Pool", hint: "Liquidity" },
    { href: "/portfolio", label: "Portfolio", hint: "Balances" },
    { href: "/terms", label: "Terms of Service", hint: "Legal" },
  ].filter((page) => page.label.toLowerCase().includes(needle));
  const tokens = TOKENS.filter((token) => `${token.symbol} ${token.name}`.toLowerCase().includes(needle));

  return (
    <Overlay onClose={app.closeModal}>
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#6d28d9] p-4">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tokens or pages"
          className="w-full rounded-2xl bg-white/5 px-4 py-3 text-base outline-none"
          aria-label="Search RomaSwap"
        />
        <div className="mt-3 max-h-80 overflow-auto">
          {tokens.map((token) => (
            <button
              key={token.id}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/5"
              onClick={() => {
                app.setBuyToken(token.id);
                app.closeModal();
                router.push("/swap");
              }}
            >
              <TokenIcon token={token} />
              <span className="flex-1">
                <span className="block font-medium">{token.name}</span>
                <span className="text-sm text-[#f3d4ff]">{token.symbol} · Base</span>
              </span>
            </button>
          ))}
          {pages.map((page) => (
            <Link key={page.href} href={page.href} className="flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-white/5" onClick={app.closeModal}>
              <span>{page.label}</span>
              <span className="text-xs text-[#f3d4ff]">{page.hint}</span>
            </Link>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

function TokenModal({ side }: { side: "sell" | "buy" }) {
  const app = useApp();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const tokens = TOKENS.filter((token) => `${token.symbol} ${token.name} ${token.address ?? ""}`.toLowerCase().includes(needle));

  return (
    <Overlay onClose={app.closeModal}>
      <div className="mx-auto flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl border border-white/10 bg-[#6d28d9] p-4">
        <ModalTitle title="Select a token" onClose={app.closeModal} />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or paste address"
          className="mb-3 w-full rounded-2xl bg-white/5 px-4 py-3 outline-none"
          aria-label="Search tokens"
        />
        <p className="mb-2 text-xs text-[#f3d4ff]">Draft Base allowlist. Arbitrary contracts are blocked in this demo.</p>
        <div className="scroll-thin overflow-auto">
          {tokens.length === 0 ? <p className="px-2 py-6 text-sm text-[#f3d4ff]">No allowlisted token matches that search.</p> : null}
          {tokens.map((token) => (
            <button
              key={token.id}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/5"
              onClick={() => {
                if (side === "sell") app.setSellToken(token.id);
                else app.setBuyToken(token.id);
                app.closeModal();
              }}
            >
              <TokenIcon token={token} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{token.symbol}</span>
                <span className="block truncate text-sm text-[#f3d4ff]">{token.name}</span>
              </span>
              <span className="text-right text-sm tabular">
                {app.wallet ? formatToken(app.balances[token.id] ?? 0) : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

function ReviewModal() {
  const app = useApp();
  const quote = app.quote;
  const buy = app.buyToken;
  if (!quote || !buy) return null;
  const wrapped = app.sellToken.id === "cbbtc" || buy.id === "cbbtc";

  return (
    <Overlay onClose={app.closeModal}>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#6d28d9] p-5">
        <ModalTitle title="Review swap" onClose={app.closeModal} />
        <p className="mb-4 text-sm text-[#f3d4ff]">Sample quote. Confirming records it in this demo session only.</p>
        <div className="grid gap-2 rounded-2xl bg-white/5 p-4">
          <Row label="You pay" value={`${formatToken(quote.sellAmount)} ${app.sellToken.symbol}`} />
          <Row label="You receive" value={`${formatToken(quote.buyAmount)} ${buy.symbol}`} />
          <Row label="Minimum received" value={`${formatToken(quote.minReceived)} ${buy.symbol}`} />
          <Row label="RomaSwap fee" value={`${formatToken(quote.feeAmount)} ${quote.feeToken.symbol} (0.25%)`} />
          <Row label="Network" value="Base · 8453" />
          <Row label="Max slippage" value={`${(app.slippageBps / 100).toFixed(2)}%`} />
          <Row label="Sample price impact" value={`${quote.priceImpactPct.toFixed(2)}%`} />
          <Row label="Sample network fee" value="~$0.03" />
        </div>
        {wrapped ? (
          <p className="mt-3 text-sm leading-6 text-[#ffe3a3]">cbBTC is Coinbase Wrapped BTC on Base. It is not native Bitcoin, and RomaSwap does not promise redemption.</p>
        ) : null}
        <button
          className="mt-4 h-12 w-full rounded-2xl bg-[#ffe14a] font-semibold text-[#1a1408] hover:bg-[#fff3a1]"
          onClick={() => app.confirmDemoSwap()}
        >
          Confirm demo swap
        </button>
      </div>
    </Overlay>
  );
}

function ReceiptModal() {
  const app = useApp();
  const latest = app.activity[0];
  return (
    <Overlay onClose={app.closeModal}>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#ffe14a]/50 bg-[#6d28d9] p-5 text-center">
        <Mascot pose="cheer" alt="The centurion celebrating a demo swap" className="mx-auto h-40 w-40 object-contain" />
        <p className="text-sm font-semibold text-[#ffe14a]">Demo receipt</p>
        <h2 className="mt-2 text-2xl font-semibold">Swap recorded</h2>
        <p className="mt-2 text-sm leading-6 text-[#f3d4ff]">No transaction was broadcast and no wallet signature was requested.</p>
        {latest ? (
          <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm">
            {latest.sellAmount} for {latest.buyAmount}
          </p>
        ) : null}
        <button className="mt-4 h-12 w-full rounded-2xl bg-[#ffe14a] font-semibold text-[#1a1408]" onClick={app.closeModal}>
          Close
        </button>
      </div>
    </Overlay>
  );
}

function NoticeModal() {
  const app = useApp();
  if (!app.notice) return null;
  return (
    <Overlay onClose={() => app.setNotice(null)}>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#6d28d9] p-5">
        <ModalTitle title={app.notice.title} onClose={() => app.setNotice(null)} />
        <p className="text-sm leading-6 text-[#cfcfcf]">{app.notice.body}</p>
        <button className="mt-4 h-11 w-full rounded-2xl bg-white/10 font-medium" onClick={() => app.setNotice(null)}>Close</button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalTitle({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label="Close" onClick={onClose}>×</button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[#f3d4ff]">{label}</span>
      <span className="text-right tabular">{value}</span>
    </div>
  );
}

function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="text-white/60">
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Dots() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="4" cy="9" r="1.3" fill="currentColor" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" />
      <circle cx="14" cy="9" r="1.3" fill="currentColor" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
