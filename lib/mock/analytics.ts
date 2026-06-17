import type { AnalyticsSeries } from "@/lib/types";

export const MOCK_ANALYTICS: AnalyticsSeries[] = [
  { date: "Jun 1", processed: 12, accepted: 9, rejected: 3 },
  { date: "Jun 2", processed: 8, accepted: 6, rejected: 2 },
  { date: "Jun 3", processed: 15, accepted: 11, rejected: 4 },
  { date: "Jun 4", processed: 6, accepted: 5, rejected: 1 },
  { date: "Jun 5", processed: 20, accepted: 14, rejected: 6 },
  { date: "Jun 6", processed: 18, accepted: 15, rejected: 3 },
  { date: "Jun 7", processed: 9, accepted: 7, rejected: 2 },
  { date: "Jun 8", processed: 22, accepted: 18, rejected: 4 },
  { date: "Jun 9", processed: 25, accepted: 20, rejected: 5 },
  { date: "Jun 10", processed: 19, accepted: 16, rejected: 3 },
  { date: "Jun 11", processed: 30, accepted: 24, rejected: 6 },
  { date: "Jun 12", processed: 28, accepted: 22, rejected: 6 },
  { date: "Jun 13", processed: 14, accepted: 12, rejected: 2 },
  { date: "Jun 14", processed: 17, accepted: 14, rejected: 3 },
  { date: "Jun 15", processed: 23, accepted: 18, rejected: 5 },
  { date: "Jun 16", processed: 10, accepted: 8, rejected: 2 },
];

export const MOCK_CLASSIFICATION_DIST = [
  { name: "Bug", value: 42, fill: "#ef4444" },
  { name: "Feature Request", value: 31, fill: "#3b82f6" },
  { name: "Question", value: 18, fill: "#f59e0b" },
  { name: "Churn Signal", value: 9, fill: "#f97316" },
];

export const MOCK_CODE_AREAS = [
  { area: "src/auth/", count: 28 },
  { area: "src/api/", count: 22 },
  { area: "src/checkout/", count: 18 },
  { area: "src/search/", count: 14 },
  { area: "src/services/", count: 11 },
  { area: "src/components/", count: 7 },
];
