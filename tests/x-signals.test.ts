import { describe, expect, it } from "vitest";
import { scoreXPosts } from "../src/core/x-signals.js";

describe("X signals", () => {
  it("weights recent positive discussion", () => {
    const result = scoreXPosts([
      { id:"1", text:"bullish breakout and partnership", createdAt:new Date().toISOString(), author:"source", verified:true, likeCount:100, repostCount:20 },
      { id:"2", text:"strong adoption growth", createdAt:new Date().toISOString(), author:"source", likeCount:50 },
    ]);
    expect(result.score).toBeGreaterThan(60);
    expect(result.confidence).toBe("low");
  });
  it("penalizes explicit scam and exploit language", () => {
    const result = scoreXPosts([{ id:"1", text:"warning: possible rug exploit, avoid", createdAt:new Date().toISOString(), author:"source", likeCount:100 }]);
    expect(result.score).toBeLessThan(45);
  });
  it("returns neutral low-confidence output without posts", () => {
    const result = scoreXPosts([]);
    expect(result.score).toBe(50);
    expect(result.confidence).toBe("low");
  });
});
