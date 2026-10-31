import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-sm leading-7 text-[#d7d7d7]">
      <h1 className="text-3xl font-medium text-white">Privacy Policy</h1>
      <p className="mt-4">
        Connecting a wallet shares the address your wallet chooses to share. RomaSwap does not ask for a seed phrase or private key. Balances for the tokens on screen are read from Base’s public network endpoint in your browser. A contract you import is stored in this browser only. A swap is not sent, and a swap signature is not requested.
      </p>
      <p className="mt-3">
        Swap instructions are not sent to a server. A later live version would send quote requests to RomaSwap’s server, which would call a swap API with the chain, tokens, amount, and fee settings. That server must not receive secrets.
      </p>
      <p className="mt-3">
        Do not paste a recovery phrase into search, token fields, or support messages. RomaSwap will never ask for one.
      </p>
      <p className="mt-6">
        <Link className="text-[#ffe14a]" href="/swap">Back to Swap</Link>
      </p>
    </article>
  );
}
