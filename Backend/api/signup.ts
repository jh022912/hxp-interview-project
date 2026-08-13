import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient } from "../lib/supabase.js";
import { isHoneypotTriggered } from "../lib/honeypot.js";
import { hashRequestIp, isRateLimited } from "../lib/rateLimit.js";
import { sanitizeSignup, signupSchema } from "../lib/validate.js";

function applyCors(req: VercelRequest, res: VercelResponse): void {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "";
  const requestOrigin = req.headers.origin;

  if (requestOrigin && requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ ok: false, error: "Invalid request body." });
    return;
  }

  // Honeypot: bots that fill this hidden field get a fake success and are
  // silently dropped — never persisted, never told they were caught.
  if (isHoneypotTriggered(body)) {
    res.status(201).json({ ok: true });
    return;
  }

  const supabase = getSupabaseClient();

  let ipHash: string;
  try {
    ipHash = hashRequestIp(req);
  } catch (error) {
    console.error("IP hashing failed:", (error as Error).message);
    res.status(500).json({ ok: false, error: "Server misconfiguration." });
    return;
  }

  if (await isRateLimited(supabase, ipHash)) {
    res.setHeader("Retry-After", "3600");
    res.status(429).json({ ok: false, error: "Too many submissions. Try again later." });
    return;
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const sanitized = sanitizeSignup(parsed.data);

  const { error: insertError } = await supabase.from("trip_signups").insert({
    trip_id: sanitized.tripId,
    full_name: sanitized.fullName,
    email: sanitized.email,
    phone: sanitized.phone,
    emergency_contact_name: sanitized.emergencyContactName,
    emergency_contact_phone: sanitized.emergencyContactPhone,
    dietary_restrictions: sanitized.dietaryRestrictions,
    reason: sanitized.reason,
    ip_hash: ipHash,
  });

  if (insertError) {
    // No PII in logs — message only, never the row we tried to insert.
    console.error("Signup insert failed:", insertError.message);
    res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
    return;
  }

  res.status(201).json({ ok: true });
}
