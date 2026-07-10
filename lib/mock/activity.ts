import type { ActivityEntry } from "@/lib/types";

export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "act001", action: "new_draft", ticketTitle: "Fix Stripe webhook timeout causing duplicate payment charges", ticketId: "t001", timestamp: "2026-06-16T11:50:00Z" },
  { id: "act002", action: "new_draft", ticketTitle: "Document SSO configuration for SAML 2.0 providers", ticketId: "t003", timestamp: "2026-06-16T11:15:00Z" },
  { id: "act003", action: "new_draft", ticketTitle: "Add bulk team member import via CSV upload", ticketId: "t006", timestamp: "2026-06-16T10:15:00Z" },
];
