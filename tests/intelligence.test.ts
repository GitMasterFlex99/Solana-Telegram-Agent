import { describe, expect, it } from "vitest";
import { assessIntelligence } from "../src/core/intelligence.js";
import type { CandidateResult } from "../src/core/candidate.js";

const candidate: CandidateResult = {
  chainId:"solana", baseToken:{address:"mint",symbol:"TEST"}, opportunityScore:80,
  momentum:{score:70,flags:[],volumeChangePct:null,liquidityChangePct:null,buyPressure:0.7},
  classification:"interesting", reasons:["Strong opportunity and momentum"],
};

describe("scanner intelligence", () => {
  it("combines opportunity, momentum and social signals", () => {
    const result = assessIntelligence(candidate, [{ id:"1", text:"bullish breakout partnership", createdAt:new Date().toISOString(), author:"source", verified:true, likeCount:100 }]);
    expect(result.score).toBeGreaterThan(60);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
  it("does not invent social confidence when no posts exist", () => {
    const result = assessIntelligence(candidate, []);
    expect(result.x.score).toBe(50);
    expect(result.x.confidence).toBe("low");
  });
});
