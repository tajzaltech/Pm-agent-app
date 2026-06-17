import type { ActivityEntry } from "@/lib/types";

export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "act001", action: "accepted", ticketTitle: "Fix mobile nav menu not closing after route change", ticketId: "t008", timestamp: "2026-06-16T12:30:00Z" },
  { id: "act002", action: "new_draft", ticketTitle: "Fix Stripe webhook timeout causing duplicate payment charges", ticketId: "t001", timestamp: "2026-06-16T11:50:00Z" },
  { id: "act003", action: "new_draft", ticketTitle: "Add keyboard shortcut to quickly switch between workspaces", ticketId: "t012", timestamp: "2026-06-16T11:40:00Z" },
  { id: "act004", action: "new_draft", ticketTitle: "Add API rate limit documentation and rate limit headers", ticketId: "t011", timestamp: "2026-06-16T11:30:00Z" },
  { id: "act005", action: "new_draft", ticketTitle: "Fix notification emails being sent to spam", ticketId: "t010", timestamp: "2026-06-16T11:20:00Z" },
  { id: "act006", action: "new_draft", ticketTitle: "Document SSO configuration for SAML 2.0 providers", ticketId: "t003", timestamp: "2026-06-16T11:15:00Z" },
  { id: "act007", action: "new_draft", ticketTitle: "Fix login redirect loop for SSO users on password reset flow", ticketId: "t005", timestamp: "2026-06-16T11:10:00Z" },
  { id: "act008", action: "new_draft", ticketTitle: "Fix search results returning stale data after index update", ticketId: "t007", timestamp: "2026-06-16T10:45:00Z" },
  { id: "act009", action: "new_draft", ticketTitle: "Resolve data export reliability issues causing compliance audit failures", ticketId: "t004", timestamp: "2026-06-16T10:30:00Z" },
  { id: "act010", action: "new_draft", ticketTitle: "Add bulk team member import via CSV upload", ticketId: "t006", timestamp: "2026-06-16T10:15:00Z" },
  { id: "act011", action: "rejected", ticketTitle: "Add native mobile app (iOS/Android)", ticketId: "t009", timestamp: "2026-06-15T16:00:00Z" },
  { id: "act012", action: "edited_accepted", ticketTitle: "Add cursor-based pagination to /api/users endpoint", ticketId: "t002", timestamp: "2026-06-15T15:00:00Z" },
  { id: "act013", action: "accepted", ticketTitle: "Fix checkout page crash on Safari 16", ticketId: "t099", timestamp: "2026-06-14T14:20:00Z" },
  { id: "act014", action: "accepted", ticketTitle: "Add CSV export to reporting dashboard", ticketId: "t098", timestamp: "2026-06-14T11:05:00Z" },
  { id: "act015", action: "rejected", ticketTitle: "Change primary button color to purple", ticketId: "t097", timestamp: "2026-06-13T09:30:00Z" },
];
