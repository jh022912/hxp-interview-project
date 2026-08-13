/**
 * Hidden form field bots fill in but humans never see (styled off-screen,
 * not display:none, so naive bots that skip display:none fields still trip it).
 */
export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  const value = body.website;
  return typeof value === "string" && value.trim().length > 0;
}
