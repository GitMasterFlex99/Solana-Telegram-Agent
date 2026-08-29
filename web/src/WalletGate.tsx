import { useState } from "react";
import { WalletModal } from "@wallet-ui/react";
import { TRADING_WALLET_WARNING } from "./wallet";

export function WalletGate() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [open, setOpen] = useState(false);

  if (!acknowledged) {
    return (
      <section aria-labelledby="wallet-safety-title">
        <h2 id="wallet-safety-title">Use a separate trading wallet</h2>
        <p>{TRADING_WALLET_WARNING}</p>
        <p>We never need your recovery phrase or private key.</p>
        <button type="button" onClick={() => setAcknowledged(true)}>
          I understand
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="wallet-title">
      <h2 id="wallet-title">Trading wallet</h2>
      <button type="button" onClick={() => setOpen(true)}>
        Connect wallet
      </button>
      {open ? <WalletModal open={open} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
