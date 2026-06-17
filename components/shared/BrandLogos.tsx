import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

function BrandIcon({
  slug,
  label,
  color,
  className,
}: LogoProps & {
  slug: string;
  label: string;
  color?: string;
}) {
  const src = color
    ? `https://cdn.simpleicons.org/${slug}/${color}`
    : `https://cdn.simpleicons.org/${slug}`;

  return (
    // Brand SVGs are loaded from Simple Icons so the onboarding cards use real marks.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${label} logo`}
      className={cn("object-contain", className)}
      draggable={false}
    />
  );
}

export function FreshdeskLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Freshdesk logo">
      <rect width="64" height="64" rx="16" fill="#25C16F" />
      <path d="M32 16c-9.4 0-17 7.6-17 17v5.8c0 3.4 2.8 6.2 6.2 6.2h3.2V32.8h-5.2A12.8 12.8 0 0 1 32 20a12.8 12.8 0 0 1 12.8 12.8h-5.2V45h3.2c3.4 0 6.2-2.8 6.2-6.2V33c0-9.4-7.6-17-17-17Z" fill="#fff" />
      <rect x="24" y="28" width="16" height="13" rx="3.5" fill="#fff" />
      <path d="M28 33h8M28 37h5" stroke="#25C16F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ZendeskLogo({ className }: LogoProps) {
  return <BrandIcon slug="zendesk" label="Zendesk" color="03363D" className={className} />;
}

export function JiraLogo({ className }: LogoProps) {
  return <BrandIcon slug="jira" label="Jira" color="0052CC" className={className} />;
}

export function SalesforceLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Salesforce logo">
      <path
        d="M40.4 13.7c3.1-3.2 7.5-5.2 12.4-5.2 6.5 0 12.2 3.6 15.1 8.9 2.5-1.1 5.2-1.7 8.1-1.7 10.9 0 19.7 8.6 19.7 19.2S86.9 54.1 76 54.1c-1.3 0-2.6-.1-3.8-.4-2.4 4.3-7.1 7.3-12.5 7.3-5.5 0-10.3-3-12.7-7.5-2.1.5-4.2.8-6.5.8-10.2 0-18.9-5.8-22.9-14.2-1.7.4-3.4.7-5.2.7C5.6 40.8 0 35.4 0 28.7s5.6-12.1 12.4-12.1c1.7 0 3.4.3 4.9 1 2.8-6.2 9.1-10.6 16.5-10.6 2.4 0 4.6.5 6.6 1.3Z"
        fill="#00A1E0"
      />
      <path d="M21.2 34.8c2.8 2.7 6.8 4.3 11.4 4.3 5.2 0 8.4-2.8 8.4-6.5 0-4.2-3.8-5.6-7.3-6.7-2.4-.8-4.5-1.4-4.5-2.9 0-1.3 1.2-2.2 3.2-2.2 2.3 0 4.5.8 6.3 2.4l2.2-3.5c-2.2-1.9-5-3-8.4-3-5 0-8.1 2.8-8.1 6.4 0 4 3.7 5.2 7.1 6.3 2.5.8 4.7 1.5 4.7 3.2 0 1.4-1.2 2.4-3.6 2.4-2.8 0-5.4-1.2-7.1-2.9l-2.3 3.7Zm22.4 3.8h4.7V27.2c0-3.3 2.2-5.7 5.3-5.7 3.1 0 5 2.2 5 5.5v11.6h4.7V26.2c0-5.7-3.2-9.4-8.5-9.4-3.2 0-5.4 1.4-6.5 3V17.2h-4.7v21.4Z" fill="#fff" />
    </svg>
  );
}

export function GoogleSheetsLogo({ className }: LogoProps) {
  return <BrandIcon slug="googlesheets" label="Google Sheets" color="34A853" className={className} />;
}

export function GitHubLogo({ className }: LogoProps) {
  return <BrandIcon slug="github" label="GitHub" color="181717" className={className} />;
}

export function BitbucketLogo({ className }: LogoProps) {
  return <BrandIcon slug="bitbucket" label="Bitbucket" color="0052CC" className={className} />;
}

export function LinearLogo({ className }: LogoProps) {
  return <BrandIcon slug="linear" label="Linear" color="5E6AD2" className={className} />;
}

export function JiraIssueLogo({ className }: LogoProps) {
  return <JiraLogo className={className} />;
}

export function MondayLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Monday.com logo">
      <path d="M15.5 45.8c-3.7 0-6.7-3-6.7-6.7 0-1.2.3-2.3.9-3.4L25.2 9.9a6.7 6.7 0 0 1 11.5 6.9L21.2 42.6a6.7 6.7 0 0 1-5.7 3.2Z" fill="#FFCB00" />
      <path d="M44.4 45.8c-3.7 0-6.7-3-6.7-6.7 0-1.2.3-2.3.9-3.4L54.1 9.9a6.7 6.7 0 0 1 11.5 6.9L50.1 42.6a6.7 6.7 0 0 1-5.7 3.2Z" fill="#00CA72" />
      <circle cx="76.2" cy="39" r="6.8" fill="#F62B54" />
    </svg>
  );
}

export function ClickUpLogo({ className }: LogoProps) {
  return <BrandIcon slug="clickup" label="ClickUp" className={className} />;
}

export function GitHubIssuesLogo({ className }: LogoProps) {
  return <GitHubLogo className={className} />;
}

export function PMAgentLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 54 54" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PM Agent logo">
      <rect width="54" height="54" rx="14" fill="url(#pmGrad)" />
      <defs>
        <linearGradient id="pmGrad" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C6FFF" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <path d="M33.5 8.5 16 31.8c-.9 1.3 0 3.1 1.6 3.1H28.2l-3.1 15.4c-.4 2.1 2.3 3.4 3.6 1.7l15.4-20.5c1-1.4.1-3.2-1.6-3.2H32l4.5-17.6c.6-2.2-2.3-3.5-3-1.2Z" fill="white" />
      <path d="M33.3 10.3 19.6 29.1c-.6.8 0 1.9.9 1.9H31.3L27.8 47l13.1-17.5c.6-.8 0-1.9-.9-1.9H28.5l4.8-17.3Z" fill="white" fillOpacity=".3" />
    </svg>
  );
}

export function SlackLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 54 54" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slack logo">
      <path d="M19.7 33.8a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4Z" fill="#E01E5A" />
      <path d="M21.7 33.8a4 4 0 0 1 4-4 4 4 0 0 1 4 4v10a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-10Z" fill="#E01E5A" />
      <path d="M25.7 20.2a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4v4h-4Z" fill="#36C5F0" />
      <path d="M25.7 22.2a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-10a4 4 0 0 1-4-4 4 4 0 0 1 4-4h10Z" fill="#36C5F0" />
      <path d="M39.3 26.2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4h4Z" fill="#2EB67D" />
      <path d="M37.3 26.2a4 4 0 0 1-4-4 4 4 0 0 1 4-4h10a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-10Z" fill="#2EB67D" />
      <path d="M33.3 39.8a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4v-4Z" fill="#ECB22E" />
      <path d="M33.3 37.8a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-10a4 4 0 0 1 4-4 4 4 0 0 1 4 4v10Z" fill="#ECB22E" />
    </svg>
  );
}

export function ZapierLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 54 54" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zapier logo">
      <circle cx="27" cy="27" r="27" fill="#FF4A00" />
      <path d="M36.8 24.8h-7.2l5.1-5.1a1.7 1.7 0 0 0-2.4-2.4l-5.1 5.1V15a1.7 1.7 0 0 0-3.4 0v7.4l-5.1-5.1a1.7 1.7 0 0 0-2.4 2.4l5.1 5.1H14a1.7 1.7 0 0 0 0 3.4h7.4l-5.1 5.1a1.7 1.7 0 1 0 2.4 2.4l5.1-5.1V39a1.7 1.7 0 0 0 3.4 0v-7.4l5.1 5.1a1.7 1.7 0 1 0 2.4-2.4l-5.1-5.1h7.2a1.7 1.7 0 0 0 0-3.4Z" fill="white" />
    </svg>
  );
}

export function ConfluenceLogo({ className }: LogoProps) {
  return <BrandIcon slug="confluence" label="Confluence" color="0052CC" className={className} />;
}

export function WebhookLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Webhook icon">
      <path
        d="M19.2 17.8a5.8 5.8 0 1 1 7.5 5.5l4 7.4a5.8 5.8 0 1 1-2.9 1.6l-4-7.4a5.8 5.8 0 0 1-1.7 0l-4.2 7.2a5.8 5.8 0 1 1-2.8-1.7l4.2-7.2a5.8 5.8 0 0 1-.1-5.4Z"
        stroke="#6554E8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="18" r="2.2" fill="#6554E8" />
      <circle cx="14.5" cy="35" r="2.2" fill="#6554E8" />
      <circle cx="33.5" cy="35" r="2.2" fill="#6554E8" />
    </svg>
  );
}
