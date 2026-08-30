export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createCooldown(windowMs: number) {
  const lastRun = new Map<number, number>();
  return {
    check(userId: number, now = Date.now()): boolean {
      const previous = lastRun.get(userId) ?? 0;
      if (now - previous < windowMs) return false;
      lastRun.set(userId, now);
      return true;
    },
    clear(userId: number) { lastRun.delete(userId); },
  };
}
