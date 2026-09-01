import { api } from "@/lib/api-client/client";
import { getSession } from "@/lib/api-client/session";
import { useAlertStore } from "@/lib/store/alerts";
import { useAuditStore } from "@/lib/store/audit";
import { useAutomationStore } from "@/lib/store/automation";
import { useClusterStore } from "@/lib/store/clusters";
import { useConnectionsStore } from "@/lib/store/connections";
import { useDeliveryStore } from "@/lib/store/delivery";
import { useDispatchStore } from "@/lib/store/dispatch";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { usePipelineStore } from "@/lib/store/pipeline";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { useProductDocsStore } from "@/lib/store/product-docs";
import { useTeamStore } from "@/lib/store/team";
import { useTicketStore } from "@/lib/store/tickets";
import { useWorkspaceStore } from "@/lib/store/workspace";

export async function hydrateWorkspace() {
  if (!getSession().accessToken) return;

  const results = await Promise.allSettled([
    api.listTickets(),
    api.getConnections(),
    api.listPipeline(),
    api.listTeam(),
    api.getAutomation(),
    api.listAlerts(),
    api.listAudit(),
    api.listChatSessions(),
    api.listProductDocs(),
    api.getDeliveryConfig(),
    api.listDeliveries(),
    api.getDispatchConfig(),
    api.listDispatches(),
    api.getOnboarding(),
    api.listWorkspaces(),
    api.listClusters(),
  ]);

  const value = <T,>(index: number): T | null => {
    const item = results[index];
    return item.status === "fulfilled" ? (item.value as T) : null;
  };

  const tickets = value<Awaited<ReturnType<typeof api.listTickets>>>(0);
  if (tickets) {
    useTicketStore.setState({ tickets: tickets.tickets, activity: tickets.activity, serverHydrated: true });
  }

  const connections = value<Awaited<ReturnType<typeof api.getConnections>>>(1);
  if (connections) {
    useConnectionsStore.setState({
      sources: connections.sources,
      outputs: connections.outputs,
      repos: connections.repos,
      devAgentEnabled: connections.devAgentEnabled,
    });
  }

  const pipeline = value<Awaited<ReturnType<typeof api.listPipeline>>>(2);
  if (pipeline) usePipelineStore.setState({ cards: pipeline });

  const team = value<Awaited<ReturnType<typeof api.listTeam>>>(3);
  if (team) {
    const current = useTeamStore.getState();
    const me = team.find((m) => m.email === current.members.find((x) => x.id === current.currentUserId)?.email) ?? team[0];
    useTeamStore.setState({ members: team, currentUserId: me?.id ?? current.currentUserId });
  }

  const automation = value<Awaited<ReturnType<typeof api.getAutomation>>>(4);
  if (automation) {
    useAutomationStore.setState({
      preset: automation.preset,
      autoClassify: automation.autoClassify,
      scopeEstimation: automation.scopeEstimation,
      autoDispatch: automation.autoDispatch,
      autoAcceptRules: automation.autoAcceptRules,
    });
  }

  const alerts = value<Awaited<ReturnType<typeof api.listAlerts>>>(5);
  if (alerts) useAlertStore.setState({ alerts });

  const audit = value<Awaited<ReturnType<typeof api.listAudit>>>(6);
  if (audit) useAuditStore.setState({ entries: audit });

  const sessions = value<Awaited<ReturnType<typeof api.listChatSessions>>>(7);
  if (sessions) {
    const active = sessions[0]?.id ?? usePmChatStore.getState().activeSessionId;
    usePmChatStore.setState({
      sessions,
      activeSessionId: active,
    });
  }

  const docs = value<Awaited<ReturnType<typeof api.listProductDocs>>>(8);
  if (docs) useProductDocsStore.setState({ docs });

  const deliveryConfig = value<Awaited<ReturnType<typeof api.getDeliveryConfig>>>(9);
  const deliveries = value<Awaited<ReturnType<typeof api.listDeliveries>>>(10);
  if (deliveryConfig || deliveries) {
    useDeliveryStore.setState({
      ...(deliveryConfig ? { config: deliveryConfig } : {}),
      ...(deliveries ? { records: deliveries } : {}),
    });
  }

  const dispatchConfig = value<Awaited<ReturnType<typeof api.getDispatchConfig>>>(11);
  const dispatches = value<Awaited<ReturnType<typeof api.listDispatches>>>(12);
  if (dispatchConfig || dispatches) {
    useDispatchStore.setState({
      ...(dispatchConfig ? { config: dispatchConfig } : {}),
      ...(dispatches ? { records: dispatches } : {}),
    });
  }

  const onboarding = value<Awaited<ReturnType<typeof api.getOnboarding>>>(13);
  if (onboarding) {
    useOnboardingStore.setState({
      isSetup: onboarding.isSetup,
      workspaceRole: onboarding.workspaceRole,
      ticketSources: onboarding.ticketSources,
      repoProvider: onboarding.repoProvider,
      repoProviderStatus: onboarding.repoProviderStatus,
      selectedRepos: onboarding.selectedRepos,
      outputTool: onboarding.outputTool,
      outputToolStatus: onboarding.outputToolStatus,
      selectedProject: onboarding.selectedProject,
    });
  }

  const workspaces = value<Awaited<ReturnType<typeof api.listWorkspaces>>>(14);
  if (workspaces && workspaces.length > 0) {
    const currentId = getSession().workspaceId ?? workspaces[0].id;
    useWorkspaceStore.setState({
      workspaces,
      activeWorkspaceId: workspaces.some((w) => w.id === currentId) ? currentId : workspaces[0].id,
    });
  }

  const clusters = value<Awaited<ReturnType<typeof api.listClusters>>>(15);
  if (clusters) useClusterStore.setState({ clusters });
}
