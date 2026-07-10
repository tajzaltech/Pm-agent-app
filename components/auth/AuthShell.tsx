import Link from "next/link";
import { BotMessageSquare, Zap } from "lucide-react";

import {
  BitbucketLogo,
  ClickUpLogo,
  ConfluenceLogo,
  FreshdeskLogo,
  GitHubIssuesLogo,
  GitHubLogo,
  GoogleSheetsLogo,
  JiraLogo,
  LinearLogo,
  MondayLogo,
  PMAgentLogo,
  SalesforceLogo,
  SlackLogo,
  WebhookLogo,
  ZapierLogo,
  ZendeskLogo,
} from "@/components/shared/BrandLogos";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sideTitle?: string;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  sideTitle = "AI agent that turns support into dev-ready tickets.",
}: AuthShellProps) {
  const toolLogos: ToolLogo[] = [
    // Row 1
    { label: "Freshdesk", Logo: FreshdeskLogo, className: "left-[5%] top-[8%] rotate-[-8deg] scale-110" },
    { label: "Zendesk", Logo: ZendeskLogo, className: "left-[24%] top-[6%] rotate-[7deg]" },
    { label: "Jira", Logo: JiraLogo, className: "left-[46%] top-[10%] rotate-[-4deg] opacity-80" },
    { label: "Salesforce", Logo: SalesforceLogo, className: "left-[68%] top-[7%] rotate-[8deg] scale-110" },
    { label: "Google Sheets", Logo: GoogleSheetsLogo, className: "left-[86%] top-[13%] rotate-[-7deg]" },
    // Row 2
    { label: "PM Agent", Logo: PMAgentLogo, className: "left-[14%] top-[28%] rotate-[10deg]" },
    { label: "GitHub", Logo: GitHubLogo, className: "left-[30%] top-[30%] rotate-[-10deg] scale-105" },
    { label: "Linear", Logo: LinearLogo, className: "left-[62%] top-[32%] rotate-[9deg]" },
    { label: "Monday.com", Logo: MondayLogo, className: "left-[80%] top-[28%] rotate-[-5deg] scale-110" },
    // Row 3 (center)
    { label: "Webhook", Logo: WebhookLogo, className: "left-[4%] top-[48%] rotate-[10deg] opacity-80" },
    { label: "Bitbucket", Logo: BitbucketLogo, className: "left-[20%] top-[50%] rotate-[14deg] opacity-70" },
    { label: "Slack", Logo: SlackLogo, className: "left-[37%] top-[47%] rotate-[-6deg] opacity-85" },
    { label: "Trello", slug: "trello", className: "left-[68%] top-[50%] rotate-[-6deg] opacity-80" },
    { label: "Asana", slug: "asana", className: "left-[85%] top-[46%] rotate-[9deg]" },
    // Row 4
    { label: "ClickUp", Logo: ClickUpLogo, className: "left-[12%] top-[68%] rotate-[8deg]" },
    { label: "GitHub Issues", Logo: GitHubIssuesLogo, className: "left-[33%] top-[72%] rotate-[-8deg]" },
    { label: "Notion", slug: "notion", className: "left-[54%] top-[68%] rotate-[6deg]" },
    { label: "HubSpot", slug: "hubspot", className: "left-[72%] top-[70%] rotate-[7deg]" },
    { label: "Intercom", slug: "intercom", className: "left-[89%] top-[65%] rotate-[-8deg]" },
    // Row 5
    { label: "GitLab", slug: "gitlab", className: "left-[4%] top-[84%] rotate-[-5deg] scale-110" },
    { label: "Figma", slug: "figma", className: "left-[24%] top-[88%] rotate-[10deg]" },
    { label: "Airtable", slug: "airtable", className: "left-[45%] top-[86%] rotate-[-10deg]" },
    { label: "Zapier", Logo: ZapierLogo, className: "left-[64%] top-[88%] rotate-[8deg]" },
    { label: "Confluence", Logo: ConfluenceLogo, className: "left-[83%] top-[82%] rotate-[-6deg] opacity-80" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-[oklch(0.96_0.02_280)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-xl shadow-lg lg:grid-cols-[1fr_460px]">
        <section className="hidden border-r bg-gradient-to-br from-[oklch(0.96_0.03_280)] to-[oklch(0.94_0.02_310)] p-10 lg:flex lg:flex-col">
          <Link href="/" className="flex w-fit items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.50_0.20_310)] shadow-md">
              <Zap className="size-5 text-primary-foreground" />
            </span>
            <span className="text-sm font-bold text-foreground">PM Agent</span>
          </Link>

          <div className="my-8 flex flex-1 items-center">
            <div className="relative h-80 w-full max-w-xl overflow-hidden">
              {toolLogos.map((tool) => (
                <ToolLogoCell key={tool.label} tool={tool} />
              ))}
              <div className="absolute left-[50%] top-[46%] z-20 -translate-x-1/2 -translate-y-1/2">
                <BotMessageSquare className="size-12 text-primary drop-shadow-[0_4px_12px_rgba(91,79,242,0.45)]" />
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{sideTitle}</h1>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="flex w-fit items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
                  <Zap className="size-5 text-primary-foreground" />
                </span>
                <span className="text-sm font-semibold text-foreground">PM Agent</span>
              </Link>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
              <h2 className={cn("mt-2 text-2xl font-bold tracking-tight text-foreground")}>{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>

            {children}

            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

type ToolLogo = {
  label: string;
  Logo?: (props: { className?: string }) => React.ReactNode;
  slug?: string;
  className: string;
};

function ToolLogoCell({ tool }: { tool: ToolLogo }) {
  const Logo = tool.Logo;

  return (
    <div
      className={cn(
        "absolute z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
        "drop-shadow-[0_12px_14px_rgba(15,23,42,0.16)]",
        tool.className
      )}
    >
      {Logo ? <Logo className="size-9" /> : <SimpleLogo slug={tool.slug ?? ""} label={tool.label} className="size-9" />}
    </div>
  );
}

function SimpleLogo({ slug, label, className }: { slug: string; label: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={`${label} logo`}
      className={cn("object-contain", className)}
      draggable={false}
    />
  );
}

