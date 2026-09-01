export interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  workspaceId: string | null;
}

const session: SessionState = {
  accessToken: null,
  refreshToken: null,
  workspaceId: null,
};

export function getSession(): SessionState {
  return { ...session };
}

export function setSession(next: Partial<SessionState>) {
  if (next.accessToken !== undefined) session.accessToken = next.accessToken;
  if (next.refreshToken !== undefined) session.refreshToken = next.refreshToken;
  if (next.workspaceId !== undefined) session.workspaceId = next.workspaceId;
}

export function clearSession() {
  session.accessToken = null;
  session.refreshToken = null;
  session.workspaceId = null;
}
