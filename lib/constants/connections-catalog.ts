/** Same provider options as onboarding signup flow */

export const SOURCE_CATALOG = [
  { id: "freshdesk", name: "Freshdesk" },
  { id: "zendesk", name: "Zendesk" },
  { id: "email", name: "Email" },
  { id: "jira_sm", name: "Jira Service Mgmt" },
  { id: "salesforce", name: "Salesforce" },
  { id: "sheets", name: "Google Sheets" },
  { id: "webhook", name: "Custom Webhook" },
] as const;

export const REPO_CATALOG = [
  { fullName: "acmetech/api-backend", name: "api-backend" },
  { fullName: "acmetech/web-frontend", name: "web-frontend" },
  { fullName: "acmetech/data-pipeline", name: "data-pipeline" },
  { fullName: "acmetech/mobile-legacy", name: "mobile-legacy" },
] as const;

export const OUTPUT_CATALOG = [
  { id: "slack", name: "Slack", defaultProject: "#support" },
  { id: "linear", name: "Linear", defaultProject: "Backend — Q3" },
  { id: "jira", name: "Jira", defaultProject: "BACK" },
  { id: "monday", name: "Monday.com", defaultProject: "Development Board" },
  { id: "clickup", name: "ClickUp", defaultProject: "Engineering" },
  { id: "github_issues", name: "GitHub Issues", defaultProject: "api-backend" },
] as const;

export const DEV_AGENT_ID = "dev_agent";
