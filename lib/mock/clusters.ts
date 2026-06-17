import type { Cluster } from "@/lib/types";

export const MOCK_CLUSTERS: Cluster[] = [
  {
    id: "cl001",
    title: "Authentication & SSO Issues",
    description: "Multiple customers experiencing login failures, SSO redirect loops, and password reset problems related to the authentication service.",
    ticketCount: 8,
    affectedCodeArea: "src/auth/",
    combinedScope: "M",
    representativeQuotes: [
      "Stuck in a login loop after trying to reset my password",
      "SSO configuration with Okta is completely undocumented",
      "Can't log in with Google SSO after the last update",
    ],
    tickets: [
      { ticketId: "t005", title: "Fix login redirect loop for SSO users on password reset flow", classification: "bug", scope: "S" },
      { ticketId: "t003", title: "Document SSO configuration for SAML 2.0 providers", classification: "question", scope: "S" },
    ],
    createdAt: "2026-06-16T06:00:00Z",
  },
  {
    id: "cl002",
    title: "Performance Degradation — Large Dataset Queries",
    description: "Customers with large datasets (>10k records) are experiencing significant slowdowns in user management, search, and reporting pages.",
    ticketCount: 5,
    affectedCodeArea: "src/api/, src/search/",
    combinedScope: "L",
    representativeQuotes: [
      "User management page takes 8+ seconds to load",
      "Search shows old content after I update it",
      "Reports take forever to generate for our 100k+ record datasets",
    ],
    tickets: [
      { ticketId: "t002", title: "Add cursor-based pagination to /api/users endpoint", classification: "feature_request", scope: "L" },
      { ticketId: "t007", title: "Fix search results returning stale data after index update", classification: "bug", scope: "M" },
    ],
    createdAt: "2026-06-15T18:00:00Z",
  },
  {
    id: "cl003",
    title: "Payment Processing Reliability",
    description: "Enterprise customers reporting payment-related issues including duplicate charges and webhook delivery failures.",
    ticketCount: 3,
    affectedCodeArea: "src/checkout/",
    combinedScope: "M",
    representativeQuotes: [
      "Customers being charged twice for the same order!",
      "Stripe webhook events sometimes not reaching our system",
    ],
    tickets: [
      { ticketId: "t001", title: "Fix Stripe webhook timeout causing duplicate payment charges", classification: "bug", scope: "M" },
    ],
    createdAt: "2026-06-16T04:00:00Z",
  },
  {
    id: "cl004",
    title: "Email Deliverability & Notification Failures",
    description: "Notification emails consistently landing in spam. Multiple enterprise customers missing critical alerts.",
    ticketCount: 6,
    affectedCodeArea: "src/services/email_service.py",
    combinedScope: "M",
    representativeQuotes: [
      "Your emails keep going to spam",
      "We've missed several critical alerts because of email issues",
      "Notification emails never arrive for our team",
    ],
    tickets: [
      { ticketId: "t010", title: "Fix notification emails being sent to spam / improve deliverability", classification: "churn_signal", scope: "M" },
    ],
    createdAt: "2026-06-15T12:00:00Z",
  },
];
