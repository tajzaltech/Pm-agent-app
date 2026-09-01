export type SourceFieldName =
  | "domain"
  | "apiKey"
  | "email"
  | "password"
  | "imapHost"
  | "spreadsheetId"
  | "sheetName"
  | "instanceUrl"
  | "clientId"
  | "clientSecret"
  | "securityToken";

export interface SourceCredentials {
  domain?: string;
  apiKey?: string;
  email?: string;
  password?: string;
  imapHost?: string;
  spreadsheetId?: string;
  sheetName?: string;
  instanceUrl?: string;
  clientId?: string;
  clientSecret?: string;
  securityToken?: string;
  accountLabel?: string;
}

export const SOURCE_FIELDS: Record<
  string,
  { name: SourceFieldName; label: string; placeholder: string; type?: string; required?: boolean }[]
> = {
  webhook: [],
  freshdesk: [
    { name: "domain", label: "Freshdesk domain", placeholder: "acme or acme.freshdesk.com", required: true },
    { name: "apiKey", label: "API key", placeholder: "Profile → API key", type: "password", required: true },
  ],
  zendesk: [
    { name: "domain", label: "Zendesk subdomain", placeholder: "acme or acme.zendesk.com", required: true },
    { name: "email", label: "Agent email", placeholder: "you@company.com", required: true },
    { name: "apiKey", label: "API token", placeholder: "Admin → Apps → API token", type: "password", required: true },
  ],
  jira_sm: [
    { name: "domain", label: "Atlassian site", placeholder: "acme.atlassian.net", required: true },
    { name: "email", label: "Atlassian email", placeholder: "you@company.com", required: true },
    { name: "apiKey", label: "API token", placeholder: "id.atlassian.com → API tokens", type: "password", required: true },
  ],
  email: [
    { name: "email", label: "Inbox address", placeholder: "support@company.com", required: true },
    { name: "password", label: "App password", placeholder: "Gmail App Password", type: "password", required: true },
    { name: "imapHost", label: "IMAP host", placeholder: "imap.gmail.com" },
  ],
  sheets: [
    { name: "spreadsheetId", label: "Spreadsheet ID", placeholder: "From the sheet URL between /d/ and /edit", required: true },
    { name: "sheetName", label: "Tab name", placeholder: "Sheet1" },
    { name: "apiKey", label: "Google API key (optional)", placeholder: "Needed if the sheet is private", type: "password" },
  ],
  salesforce: [
    { name: "email", label: "Salesforce username", placeholder: "you@company.com", required: true },
    { name: "password", label: "Password", placeholder: "Salesforce password", type: "password", required: true },
    { name: "securityToken", label: "Security token", placeholder: "Reset from Salesforce email", type: "password", required: true },
    { name: "clientId", label: "Consumer key", placeholder: "Connected App consumer key", required: true },
    { name: "clientSecret", label: "Consumer secret", placeholder: "Connected App consumer secret", type: "password", required: true },
    { name: "instanceUrl", label: "Login URL", placeholder: "https://login.salesforce.com" },
  ],
};

export const SOURCE_HELP: Record<string, string> = {
  webhook: "After connecting, copy the webhook URL and secret. POST ticket JSON from any system.",
  freshdesk: "Profile picture → Profile settings → API key. Connecting imports recent tickets.",
  zendesk: "Admin Center → Apps and integrations → Zendesk API → Add API token.",
  jira_sm: "https://id.atlassian.com/manage-profile/security/api-tokens — then we import recent Jira issues.",
  email: "Gmail: Google Account → Security → App passwords. Other hosts: use IMAP.",
  sheets: "Share the sheet as 'Anyone with the link can view', or add a Google Cloud API key with Sheets enabled. First row: Subject, Body, Name, Email.",
  salesforce:
    "Create a Connected App, enable OAuth and username-password flow, then paste consumer key/secret. We import recent Cases.",
};

export const SOURCE_WEBHOOK_STEPS: Record<string, string[]> = {
  freshdesk: [
    "Admin → Workflows → Automations → Ticket creation.",
    "Add a webhook action and paste the URL below.",
    "Send header X-Pm-Agent-Secret with the secret.",
  ],
  zendesk: [
    "Admin Center → Apps → Webhooks → Create webhook.",
    "Paste the Zendesk URL below and add header X-Pm-Agent-Secret.",
    "Trigger it from a ticket created trigger.",
  ],
  jira_sm: [
    "Jira → System → Webhooks.",
    "Paste the Jira URL below and include X-Pm-Agent-Secret.",
    "Subscribe to issue created.",
  ],
  salesforce: [
    "Use an Outbound Message or Flow HTTP callout to the Salesforce URL.",
    "Include header X-Pm-Agent-Secret.",
    "Send Case fields: Id, Subject, Description, SuppliedEmail, SuppliedName.",
  ],
  email: [
    "IMAP import runs when you connect or click Sync.",
    "Or POST inbound mail JSON to the email webhook URL (from, subject, text).",
  ],
  sheets: [
    "Click Sync to re-read the spreadsheet.",
    "Keep a header row: Subject, Body, Name, Email.",
  ],
  webhook: [
    "POST JSON to the ingest URL with X-Pm-Agent-Secret.",
    "Fields: subject, body, customer_name, customer_email, external_id.",
  ],
};
