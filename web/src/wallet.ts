import { autoDiscover, createWalletUi, type UiWallet } from "@wallet-ui/react";

export const TRADING_WALLET_WARNING =
  "Use a separate trading wallet. Do not connect your main wallet. Create a dedicated wallet in Phantom or another mainstream Solana wallet and only fund it with what you are comfortable losing.";

export function createTradingWalletUi() {
  return createWalletUi({ wallets: autoDiscover() });
}

export function getPublicAddress(wallet: UiWallet | null): string | null {
  if (!wallet) return null;
  const account = wallet.accounts[0];
  return account?.address ?? null;
}
