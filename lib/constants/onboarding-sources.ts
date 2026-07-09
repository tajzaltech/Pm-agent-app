import type { IssueCategory } from "@/lib/types";

export const ISSUE_CATEGORY_OPTIONS: { id: IssueCategory; label: string }[] = [
  { id: "bug", label: "Bug reports" },
  { id: "suggestion", label: "Suggestions" },
  { id: "how_to", label: "How-to questions" },
  { id: "billing", label: "Billing / refunds" },
  { id: "complaint", label: "Complaints" },
  { id: "feature_request", label: "Feature requests" },
];

export const DEFAULT_SOURCE_CATEGORIES: Record<string, IssueCategory[]> = {
  freshdesk: ["bug", "how_to", "billing"],
  zendesk: ["bug", "complaint", "how_to"],
  email: ["bug", "how_to", "suggestion"],
  jira_sm: ["bug", "feature_request", "how_to"],
  salesforce: ["billing", "complaint", "feature_request"],
  sheets: ["bug", "suggestion"],
  webhook: ["bug", "how_to"],
};

export const MOCK_SOURCE_ACCOUNTS: Record<string, string> = {
  freshdesk: "acme.freshdesk.com",
  zendesk: "acme.zendesk.com",
  email: "support@acme.io",
  jira_sm: "acme.atlassian.net",
  salesforce: "acme.my.salesforce.com",
  sheets: "Acme Support Tracker",
  webhook: "Custom HTTP endpoint",
  github: "github.com/acmetech",
  bitbucket: "bitbucket.org/acmetech",
  linear: "linear.app/acme",
  jira: "acme.atlassian.net",
  monday: "acme.monday.com",
  clickup: "acme.clickup.com",
  github_issues: "github.com/acmetech",
};
