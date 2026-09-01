import { getConfig } from "@/lib/config";

const STATE_KEY = "pm-agent-google-oauth";

export interface GoogleOAuthIntent {
  nonce: string;
  mode: "signin" | "signup";
  company?: string;
}

export function googleRedirectUri() {
  const configured = getConfig().appOrigin.replace(/\/$/, "");
  const origin = configured || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/auth/google/callback`;
}

export function startGoogleOAuth(input: {
  clientId: string;
  mode: "signin" | "signup";
  company?: string;
}) {
  const nonce = crypto.randomUUID();
  const intent: GoogleOAuthIntent = {
    nonce,
    mode: input.mode,
    company: input.company?.trim() || undefined,
  };
  sessionStorage.setItem(STATE_KEY, JSON.stringify(intent));

  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: nonce,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function takeGoogleOAuthIntent(state: string | null): GoogleOAuthIntent | null {
  const raw = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!raw || !state) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleOAuthIntent;
    if (!parsed?.nonce || parsed.nonce !== state) return null;
    return parsed;
  } catch {
    return null;
  }
}
