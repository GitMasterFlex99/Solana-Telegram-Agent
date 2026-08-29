"use client";

import { useState } from "react";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWalletStatus,
  useWallets,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import type { AppClient } from "./client";
import { TRADING_WALLET_WARNING } from "./wallet";

function truncate(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function WalletGate() {
  const [acknowledged, setAcknowledged] = useState(false);
  const client = useClient<AppClient>();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

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

  if (status === "pending") {
    return <section aria-busy="true">Checking wallet connection…</section>;
  }

  if (connected) {
    return (
      <section aria-labelledby="wallet-title">
        <h2 id="wallet-title">Trading wallet</h2>
        <p>{truncate(connected.account.address)}</p>
        <p>Devnet only. Mainnet trading is locked.</p>
        <button type="button" onClick={() => disconnect.dispatch()} disabled={disconnect.isRunning}>
          Disconnect
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="wallet-title">
      <h2 id="wallet-title">Trading wallet</h2>
      <p>Connect your dedicated trading wallet. Never connect your main wallet.</p>
      {wallets.length === 0 ? <p>No compatible wallet detected.</p> : null}
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          type="button"
          disabled={connect.isRunning}
          onClick={() => connect.dispatch(wallet)}
        >
          {connect.isRunning ? "Connecting…" : `Connect ${wallet.name}`}
        </button>
      ))}
      {connect.error ? <p role="alert">Wallet connection failed. Try again.</p> : null}
    </section>
  );
}
