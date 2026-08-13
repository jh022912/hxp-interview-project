import type { SignupPayload, SignupResult } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

export async function submitSignup(payload: SignupPayload): Promise<SignupResult> {
  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as SignupResult | null;

    if (!data) {
      return { ok: false, error: "Unexpected server response. Please try again." };
    }

    return data;
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}
