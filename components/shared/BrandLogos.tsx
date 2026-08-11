import { cn } from "@/lib/utils";

import Image from "next/image";

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
  // Official Salesforce cloud mark (single path, brand blue).
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Salesforce logo">
      <path
        d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 01-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 018.88 20.4a4.302 4.302 0 01-4.05-2.82c-.27.062-.54.076-.825.076-2.204 0-4.005-1.8-4.005-4.05 0-1.5.811-2.805 2.01-3.51-.255-.57-.39-1.2-.39-1.846 0-2.58 2.1-4.65 4.65-4.65 1.53 0 2.85.705 3.72 1.8"
        fill="#00A1E0"
      />
    </svg>
  );
}

export function EmailLogo({ className }: LogoProps) {
  // "Email" is a generic source (forwarded inbox), so this is a neutral envelope
  // rather than any one mail provider's brand mark.
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Email icon">
      <rect x="2" y="4.5" width="20" height="15" rx="2.5" fill="#5b43d6" />
      <path d="M4.5 8l7.5 5 7.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
    <Image
      src="/ask-pm-logo-v3.png"
      alt="Ask PM"
      width={512}
      height={512}
      className={className}
    />
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
