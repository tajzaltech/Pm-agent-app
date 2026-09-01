export function getConfig() {
  const onVercel = Boolean(process.env.VERCEL);
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? (onVercel ? "" : "http://localhost:8000"),
    apiPrefix: "/v1",
    appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN ?? (onVercel ? "" : "http://localhost:3000"),
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  };
}

export function getApiUrl(path: string) {
  const { apiBaseUrl, apiPrefix } = getConfig();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${apiPrefix}${normalized}`;
}

export function getIngestWebhookUrl(workspaceId: string) {
  return getApiUrl(`/webhooks/ingest/${workspaceId}`);
}

export function getSourceWebhookUrl(provider: string, workspaceId: string) {
  const routes: Record<string, string> = {
    freshdesk: `/webhooks/freshdesk/${workspaceId}`,
    zendesk: `/webhooks/zendesk/${workspaceId}`,
    jira_sm: `/webhooks/jira/${workspaceId}`,
    salesforce: `/webhooks/salesforce/${workspaceId}`,
    email: `/webhooks/email/${workspaceId}`,
    webhook: `/webhooks/ingest/${workspaceId}`,
    sheets: `/webhooks/ingest/${workspaceId}`,
  };
  return getApiUrl(routes[provider] ?? routes.webhook);
}
