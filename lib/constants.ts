import type { Classification, Scope } from "./types";

export const INGEST_WEBHOOK_URL = "https://api.pmagent.io/webhooks/ingest/org_abc123";

export const CLASSIFICATION_CONFIG: Record<
  Classification,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  bug: {
    label: "Bug",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: "bug",
  },
  feature_request: {
    label: "Feature Request",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "sparkles",
  },
  question: {
    label: "Question",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "circle-help",
  },
  churn_signal: {
    label: "Churn Signal",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "triangle-alert",
  },
};

export const SCOPE_CONFIG: Record<
  Scope,
  { label: string; color: string; bgColor: string; borderColor: string; tooltip: string }
> = {
  S: {
    label: "S",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    tooltip: "Small — isolated change, 1-2 files, minimal risk",
  },
  M: {
    label: "M",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    tooltip: "Medium — moderate scope, multiple files or services",
  },
  L: {
    label: "L",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    tooltip: "Large — broad impact, refactor or cross-service change",
  },
};

export const SOURCE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  freshdesk: { label: "Freshdesk", color: "text-teal-600" },
  zendesk: { label: "Zendesk", color: "text-green-600" },
  jira_sm: { label: "Jira SM", color: "text-blue-600" },
  salesforce: { label: "Salesforce", color: "text-sky-600" },
  sheets: { label: "Google Sheets", color: "text-emerald-600" },
  webhook: { label: "Webhook", color: "text-purple-600" },
  email: { label: "Email", color: "text-sky-600" },
  pm_chat: { label: "PM Agent Chat", color: "text-violet-600" },
};

export const NAV_ITEMS = [
  { href: "/triage", label: "Triage", icon: "inbox" },
  { href: "/chat", label: "AI PM", icon: "message-square" },
  { href: "/insights", label: "Insights", icon: "bar-chart-2" },
  { href: "/connections", label: "Connections", icon: "network" },
] as const;
