import { ClientProvider } from "@solana/react";
import { client } from "./client";
import { WalletGate } from "./WalletGate";

export function App() {
  return (
    <ClientProvider client={client}>
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <header>
          <p style={{ opacity: 0.6, marginBottom: 6 }}>Solana Telegram Agent</p>
          <h1 style={{ marginTop: 0 }}>Trading wallet</h1>
        </header>
        <WalletGate />
      </main>
    </ClientProvider>
  );
}
