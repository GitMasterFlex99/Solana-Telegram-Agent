import { socialSignal, type SocialMention } from "../core/social-signals.js";

export type XSignal = ReturnType<typeof socialSignal> & { available: boolean; reason?: string };

type XPost = { author_id?: string; created_at?: string; text?: string };
type XUser = { id?: string; username?: string; verified?: boolean; public_metrics?: { followers_count?: number } };
type XResponse = { data?: XPost[]; includes?: { users?: XUser[] } };

function queryPart(value: string): string {
  return value.replace(/[^A-Za-z0-9_.$-]/g, "").slice(0, 80);
}

const unavailable = (reason: string): XSignal => ({
  available: false,
  score: 0,
  mentions: 0,
  independentAccounts: 0,
  earlyMentions: 0,
  evidenceMentions: 0,
  lateMentions: 0,
  promotionalMentions: 0,
  credibleAccounts: 0,
  summary: "X signal unavailable",
  reason,
});

export async function fetchXSignal(symbol: string, address: string, fetchImpl: typeof fetch = fetch): Promise<XSignal> {
  const bearer = process.env.X_BEARER_TOKEN?.trim();
  if (!bearer) return unavailable("X_BEARER_TOKEN not configured");

  const terms = [queryPart(symbol), queryPart(address)].filter(Boolean);
  if (!terms.length) return unavailable("No searchable token identifier");

  const q = `(${terms.map(term => `"${term}"`).join(" OR ")}) -is:retweet`;
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", q);
  url.searchParams.set("max_results", "25");
  url.searchParams.set("tweet.fields", "created_at");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username,verified,public_metrics");

  try {
    const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${bearer}` } });
    if (!response.ok) return unavailable(`X API HTTP ${response.status}`);
    const data = await response.json() as XResponse;
    const users = new Map((data.includes?.users ?? []).map(user => [user.id, user]));
    const mentions: SocialMention[] = (data.data ?? []).map(post => {
      const user = users.get(post.author_id);
      const text = post.text ?? "";
      return {
        account: user?.username ?? post.author_id ?? "unknown",
        mentionedAt: post.created_at ? Date.parse(post.created_at) : Date.now(),
        hasEvidence: /\b(github|docs?|contract|website|audit|source|announcement|roadmap)\b/i.test(text),
        followers: user?.public_metrics?.followers_count,
        verified: user?.verified,
        text,
      };
    });
    return { available: true, ...socialSignal(mentions) };
  } catch (error) {
    console.error("X signal lookup failed", error);
    return unavailable("X API request failed");
  }
}
