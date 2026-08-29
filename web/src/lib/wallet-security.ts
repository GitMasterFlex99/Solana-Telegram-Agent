export type WalletSession = {
  address: string;
  cluster: "devnet" | "mainnet-beta";
};

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function validatePublicAddress(address: string): boolean {
  return address.length >= 32 && address.length <= 44 && BASE58.test(address);
}

export function assertTradingWallet(session: WalletSession): void {
  if (!validatePublicAddress(session.address)) {
    throw new Error("Invalid wallet address");
  }
  if (session.cluster !== "mainnet-beta" && session.cluster !== "devnet") {
    throw new Error("Unsupported Solana cluster");
  }
}

/** Never persist this object to localStorage/sessionStorage. */
export function sanitizeWalletForUi(session: WalletSession) {
  assertTradingWallet(session);
  return { address: session.address, cluster: session.cluster };
}
