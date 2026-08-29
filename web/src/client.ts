import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletStandard } from "@solana/kit-plugin-wallet";

const DEVNET_RPC = "https://api.devnet.solana.com";

export const client = createClient()
  .use(walletStandard())
  .use(solanaRpc(DEVNET_RPC));

export type AppClient = typeof client;
