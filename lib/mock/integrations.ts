import type { Integration, Repo } from "@/lib/types";

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: "int001",
    type: "source",
    provider: "freshdesk",
    name: "Freshdesk",
    status: "connected",
    ticketCount: 847,
    connectedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "int002",
    type: "source",
    provider: "zendesk",
    name: "Zendesk",
    status: "connected",
    ticketCount: 312,
    connectedAt: "2026-05-15T14:00:00Z",
  },
  {
    id: "int003",
    type: "output",
    provider: "linear",
    name: "Linear",
    status: "connected",
    ticketCount: 94,
    targetProject: "Backend — Q3",
    connectedAt: "2026-05-01T10:30:00Z",
  },
];

export const MOCK_REPOS: Repo[] = [
  {
    id: "repo001",
    platform: "github",
    name: "api-backend",
    fullName: "acmetech/api-backend",
    status: "indexed",
    lastIndexed: "2026-06-16T08:00:00Z",
    selected: true,
  },
  {
    id: "repo002",
    platform: "github",
    name: "web-frontend",
    fullName: "acmetech/web-frontend",
    status: "indexed",
    lastIndexed: "2026-06-16T08:02:00Z",
    selected: true,
  },
  {
    id: "repo003",
    platform: "github",
    name: "data-pipeline",
    fullName: "acmetech/data-pipeline",
    status: "needs_reindex",
    lastIndexed: "2026-06-10T08:00:00Z",
    selected: true,
  },
  {
    id: "repo004",
    platform: "github",
    name: "mobile-legacy",
    fullName: "acmetech/mobile-legacy",
    status: "indexed",
    lastIndexed: "2026-06-14T20:00:00Z",
    selected: false,
  },
];
