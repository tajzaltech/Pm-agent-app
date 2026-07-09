import { useConnectionsStore } from "@/lib/store/connections";
import type { OnboardingStore } from "@/lib/store/onboarding";

type SyncSlice = Pick<
  OnboardingStore,
  | "ticketSources"
  | "selectedRepos"
  | "outputTool"
  | "outputToolStatus"
  | "repoProviderStatus"
>;

/** Push completed onboarding choices into the persisted Connections map. */
export function syncOnboardingToConnections(state: SyncSlice) {
  const conn = useConnectionsStore.getState();

  for (const src of state.ticketSources.filter((s) => s.status === "connected")) {
    if (!conn.sources.some((s) => s.provider === src.provider)) {
      conn.addSource(src.provider);
    }
  }

  if (state.repoProviderStatus === "connected") {
    for (const repoFullName of state.selectedRepos) {
      if (!conn.repos.some((r) => r.fullName === repoFullName)) {
        conn.addRepo(repoFullName);
      }
    }
  }

  if (state.outputTool && state.outputToolStatus === "connected") {
    if (!conn.outputs.some((o) => o.provider === state.outputTool)) {
      conn.addOutput(state.outputTool);
    }
  }
}
