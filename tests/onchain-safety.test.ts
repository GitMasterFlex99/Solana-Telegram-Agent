import { describe, expect, it, vi } from "vitest";
import { inspectToken } from "../src/core/onchain-safety.js";

describe("on-chain token safety", () => {
  it("detects active authorities and holder concentration", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jsonrpc: "2.0", id: 1,
        result: { value: { owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", data: { parsed: { info: { mintAuthority: "authority", freezeAuthority: "freeze", supply: "1000000", decimals: 0 } } } } }
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jsonrpc: "2.0", id: 1,
        result: { value: [
          { amount: "250000", decimals: 0 },
          { amount: "150000", decimals: 0 },
          { amount: "100000", decimals: 0 },
          { amount: "50000", decimals: 0 },
          { amount: "50000", decimals: 0 }
        ] }
      })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await inspectToken("https://rpc.example", "Mint111111111111111111111111111111111111111");
    expect(result.tokenProgram).toBe("spl-token");
    expect(result.mintAuthorityActive).toBe(true);
    expect(result.freezeAuthorityActive).toBe(true);
    expect(result.topHolderPercent).toBe(25);
    expect(result.top5HolderPercent).toBe(60);
    expect(result.extensions).toEqual([]);
    expect(result.flags).toContain("Top token account holds 20%+ of supply");
    expect(result.flags).toContain("Top 5 token accounts hold 50%+ of supply");
  });

  it("identifies Token-2022 and its high-impact extensions", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        result: { value: { owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", data: { parsed: { info: {
          supply: "100", decimals: 0,
          extensions: [
            { extension: "PermanentDelegate" },
            { extension: "TransferHook" },
            { extension: "DefaultAccountState" },
            { extension: "Pausable" },
            { extension: "TransferFeeConfig" },
            { extension: "MintCloseAuthority" }
          ]
        } } } } }
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: { value: [] } })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await inspectToken("https://rpc.example", "Mint222222222222222222222222222222222222222");
    expect(result.tokenProgram).toBe("token-2022");
    expect(result.extensions).toEqual(["PermanentDelegate", "TransferHook", "DefaultAccountState", "Pausable", "TransferFeeConfig", "MintCloseAuthority"]);
    expect(result.flags).toContain("Token uses Token-2022; extensions require additional review");
    expect(result.flags).toContain("Token-2022 PermanentDelegate can authorize transfers or burns across token accounts");
    expect(result.flags).toContain("Token-2022 TransferHook can invoke another program during transfers");
    expect(result.flags).toContain("Token-2022 DefaultAccountState can cause new accounts to start frozen");
    expect(result.flags).toContain("Token-2022 Pausable can pause token operations");
    expect(result.flags).toContain("Token-2022 TransferFeeConfig applies transfer fees");
    expect(result.flags).toContain("Token-2022 MintCloseAuthority can close the mint");
  });
});
