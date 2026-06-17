import type { AnomalyAlert } from "@/lib/types";

export const MOCK_ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: "al001",
    title: "Authentication ticket spike — 10x in 48h",
    description: "Authentication-related tickets spiked from 2/week average to 23 in the last 48 hours. Cluster: Authentication & SSO Issues.",
    ticketIds: ["t003", "t005"],
    clusterId: "cl001",
    severity: "high",
    createdAt: "2026-06-16T06:00:00Z",
    dismissed: false,
  },
  {
    id: "al002",
    title: "Churn signal rate elevated — 3 enterprise accounts at risk",
    description: "3 enterprise-tier churn signals detected in the last 24h. Historical rate: 0.5/week.",
    ticketIds: ["t004", "t010"],
    severity: "high",
    createdAt: "2026-06-16T09:00:00Z",
    dismissed: false,
  },
  {
    id: "al003",
    title: "Payment-related tickets — 4x increase",
    description: "Payment issue reports increased 4x compared to last week. May indicate a recent regression.",
    ticketIds: ["t001"],
    clusterId: "cl003",
    severity: "medium",
    createdAt: "2026-06-15T18:00:00Z",
    dismissed: false,
  },
];
