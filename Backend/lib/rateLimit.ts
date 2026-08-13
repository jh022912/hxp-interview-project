import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

const MAX_SUBMISSIONS = 5;
const WINDOW_MINUTES = 60;

/**
 * Raw IPs are never persisted (PII). We only ever store/compare a salted
 * hash, which is enough to rate-limit without keeping an identifiable log.
 */
export function hashRequestIp(req: VercelRequest): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error("Missing IP_HASH_SALT environment variable.");
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";

  return createHash("sha256").update(`${salt}:${rawIp}`).digest("hex");
}

/**
 * Reuses the trip_signups table itself (via ip_hash + created_at) rather
 * than standing up a separate rate-limit store. Durable across cold starts,
 * unlike an in-memory counter — the tradeoff documented in the README is
 * that a determined attacker rotating IPs isn't stopped by this alone.
 */
export async function isRateLimited(
  supabase: SupabaseClient,
  ipHash: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("trip_signups")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (error) {
    // Fail closed would take the whole endpoint down on a transient DB hiccup;
    // fail open here and let validation/insert catch real problems downstream.
    console.error("Rate limit check failed:", error.message);
    return false;
  }

  return (count ?? 0) >= MAX_SUBMISSIONS;
}
