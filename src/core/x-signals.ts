export type XPost = { id: string; text: string; createdAt: string; author: string; verified?: boolean; likeCount?: number; repostCount?: number; replyCount?: number; quoteCount?: number };
export type XSignal = { score: number; posts: XPost[]; reasons: string[]; confidence: "low" | "medium" | "high" };

const positive = /\b(bullish|breakout|launch|listing|partnership|integrat|adoption|growth|buy|accumulat|alpha|airdrop|mainnet)\b/gi;
const negative = /\b(sc(am|ammy)|rug|honeypot|exploit|hack|drain|freeze|dump|sell|fraud|fake|warning|avoid)\b/gi;

export function scoreXPosts(posts: XPost[], now = Date.now()): XSignal {
  if (!posts.length) return { score: 50, posts: [], reasons: ["No X signal available"], confidence: "low" };
  let weighted = 0; let weightTotal = 0; const reasons: string[] = [];
  for (const post of posts.slice(0, 100)) {
    const ageHours = Math.max(0, (now - Date.parse(post.createdAt)) / 3_600_000);
    const freshness = Math.max(0.2, 1 - Math.min(ageHours, 168) / 168);
    const engagement = Math.min(3, Math.log10(1 + (post.likeCount ?? 0) + (post.repostCount ?? 0) * 2 + (post.quoteCount ?? 0) * 2));
    const credibility = post.verified ? 1.25 : 1;
    const pos = (post.text.match(positive) ?? []).length;
    const neg = (post.text.match(negative) ?? []).length;
    const signal = Math.max(-1, Math.min(1, (pos - neg) / 3));
    const weight = freshness * Math.max(0.5, engagement) * credibility;
    weighted += signal * weight; weightTotal += weight;
  }
  const normalized = weightTotal ? weighted / weightTotal : 0;
  const score = Math.round(50 + normalized * 40);
  if (score >= 65) reasons.push("Positive X discussion is outweighing negative language");
  else if (score <= 35) reasons.push("Negative X discussion is outweighing positive language");
  else reasons.push("X discussion is mixed or inconclusive");
  const confidence = posts.length >= 20 ? "high" : posts.length >= 5 ? "medium" : "low";
  return { score: Math.max(0, Math.min(100, score)), posts: posts.slice(0, 10), reasons, confidence };
}

export async function searchX(query: string, bearerToken: string, signal?: AbortSignal): Promise<XPost[]> {
  const params = new URLSearchParams({ query: `${query} -is:retweet -is:reply`, max_results: "100", "tweet.fields": "created_at,public_metrics,author_id", expansions: "author_id", "user.fields": "username,verified" });
  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params.toString()}`, { headers: { Authorization: `Bearer ${bearerToken}` }, signal });
  if (!response.ok) throw new Error(`X API request failed: ${response.status}`);
  const body = await response.json() as { data?: Array<{ id:string;text:string;created_at?:string;author_id?:string;public_metrics?:{like_count?:number;retweet_count?:number;reply_count?:number;quote_count?:number}}>; includes?: { users?: Array<{id:string;username?:string;verified?:boolean}> } };
  const users = new Map((body.includes?.users ?? []).map(u => [u.id, u]));
  return (body.data ?? []).map(p => ({ id:p.id, text:p.text, createdAt:p.created_at ?? new Date().toISOString(), author:users.get(p.author_id ?? "")?.username ?? p.author_id ?? "unknown", verified:users.get(p.author_id ?? "")?.verified, likeCount:p.public_metrics?.like_count, repostCount:p.public_metrics?.retweet_count, replyCount:p.public_metrics?.reply_count, quoteCount:p.public_metrics?.quote_count }));
}
