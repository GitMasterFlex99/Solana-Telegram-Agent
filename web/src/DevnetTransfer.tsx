"use client";

import { useState } from "react";
import { useClient } from "@solana/react";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import type { AppClient } from "./client";

/**
 * Safety test only. This component must never be enabled on mainnet.
 * It creates no arbitrary transaction bytes and does not accept a destination
 * from Telegram or an AI/social signal.
 */
export function DevnetTransfer({ recipient }: { recipient: string }) {
  const client = useClient<AppClient>();
  const wallet = useConnectedWallet(client);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [signature, setSignature] = useState("");

  const enabled = client.cluster === "solana:devnet";

  async function send() {
    if (!enabled || !wallet?.signer) return;
    setState("sending");
    try {
      // Deliberately leave the transaction construction behind the release gate.
      // A devnet test must be implemented with a fixed, audited recipient and
      // fixed micro-amount before this UI is enabled.
      throw new Error("Devnet transfer release gate is not enabled yet");
    } catch (error) {
      console.error("Devnet transfer blocked", error);
      setState("error");
    }
  }

  if (!wallet) return null;
  return (
    <section aria-labelledby="devnet-test-title">
      <h2 id="devnet-test-title">Devnet signing test</h2>
      <p>Fixed recipient: {recipient.slice(0, 4)}…{recipient.slice(-4)}</p>
      <p>Cluster: devnet only. Mainnet is permanently disabled in this test.</p>
      <button disabled={!enabled || state === "sending"} onClick={send}>
        {state === "sending" ? "Preparing…" : "Test wallet signing"}
      </button>
      {state === "done" ? <p>Confirmed: {signature}</p> : null}
      {state === "error" ? <p>Blocked by the safety gate.</p> : null}
    </section>
  );
}
