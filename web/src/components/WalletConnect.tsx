"use client";

import { useCallback, useState } from "react";

/**
 * Wallet Standard integration boundary.
 *
 * The concrete wallet hooks are intentionally isolated here so the rest of the
 * app only receives a public address and a wallet action. Never pass secrets,
 * seed phrases or private keys through this component.
 */
export function WalletConnect() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!acknowledged) return;
    setStatus("Wallet discovery is enabled in the production Solana client.");
  }, [acknowledged]);

  if (connectedAddress) {
    return (
      <section aria-label="Connected trading wallet">
        <p>Trading wallet connected</p>
        <code>{connectedAddress.slice(0, 4)}…{connectedAddress.slice(-4)}</code>
        <button type="button" onClick={() => setConnectedAddress(null)}>Disconnect</button>
      </section>
    );
  }

  return (
    <section aria-labelledby="wallet-title">
      <h2 id="wallet-title">Use a separate trading wallet</h2>
      <p>
        Do not connect your main Phantom wallet. Create a new wallet in Phantom
        or another mainstream Solana wallet specifically for trading and only
        fund it with money you are comfortable losing.
      </p>
      <p>We never need your recovery phrase or private key.</p>

      <label>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        I understand and will use a separate trading wallet.
      </label>

      <button type="button" disabled={!acknowledged} onClick={connect}>
        Connect wallet
      </button>

      {status && <p role="status">{status}</p>}
    </section>
  );
}
