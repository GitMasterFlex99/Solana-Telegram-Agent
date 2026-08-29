export type Bucket = { startedAt: number; count: number };

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly maxActions: number,
    private readonly maxKeys = 10_000,
  ) {}

  isLimited(key: string, now = Date.now()): boolean {
    const current = this.buckets.get(key);
    if (!current || now - current.startedAt >= this.windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      this.prune(now);
      return false;
    }
    current.count += 1;
    return current.count > this.maxActions;
  }

  private prune(now: number) {
    if (this.buckets.size <= this.maxKeys) return;
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.startedAt >= this.windowMs) this.buckets.delete(key);
      if (this.buckets.size <= this.maxKeys) break;
    }
  }
}
