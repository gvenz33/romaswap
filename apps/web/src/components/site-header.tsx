"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@romaswap/ui";
import { WalletButton } from "@/components/wallet-button";

const links = [
  { href: "/", label: "Swap" },
  { href: "/history", label: "History" },
  { href: "/admin", label: "Analytics" },
  { href: "/disclosures", label: "Disclosures" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="group">
          <span className="font-serif text-3xl tracking-wide text-gold-bright">RomaSwap</span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.22em] text-mute">Base · noncustodial</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                pathname === link.href ? "text-gold-bright" : "text-mute hover:text-cream",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
