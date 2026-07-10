import { cn } from "@/lib/utils";

const LOGOS: Record<string, { bg: string; svg: React.ReactNode }> = {
  freshdesk: {
    bg: "bg-[#0ea5e9]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/>
      </svg>
    ),
  },
  zendesk: {
    bg: "bg-[#03363D]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <path d="M12 2L2 12h7v10l10-10h-7V2z" fill="white"/>
      </svg>
    ),
  },
  intercom: {
    bg: "bg-[#286EFA]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <path d="M19 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V4a2 2 0 00-2-2zM7 13.5a1 1 0 11-2 0v-3a1 1 0 112 0v3zm4 2a1 1 0 11-2 0v-7a1 1 0 112 0v7zm4-1a1 1 0 11-2 0v-5a1 1 0 112 0v5zm4-1a1 1 0 11-2 0v-3a1 1 0 112 0v3z" fill="white"/>
      </svg>
    ),
  },
  hubspot: {
    bg: "bg-[#FF7A59]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <circle cx="12" cy="12" r="4" fill="white"/>
        <circle cx="12" cy="4" r="2" fill="white"/>
        <circle cx="12" cy="20" r="2" fill="white"/>
        <path d="M12 6v4M12 14v4" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  github: {
    bg: "bg-[#24292F]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  gitlab: {
    bg: "bg-[#FC6D26]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M12 21.35l7.18-5.54a.71.71 0 00.26-.8l-1.44-4.43-2.76-8.49a.36.36 0 00-.68 0L11.8 10.58H12.2l-2.76-8.49a.36.36 0 00-.68 0L5.99 10.58 4.56 15.01a.71.71 0 00.26.8L12 21.35z"/>
      </svg>
    ),
  },
  bitbucket: {
    bg: "bg-[#2684FF]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M3.27 4.03a.61.61 0 00-.61.72l2.47 15.02a.83.83 0 00.81.68h12.37a.61.61 0 00.61-.52l2.47-15.18a.61.61 0 00-.61-.72H3.27zm10.03 10.76H10.7l-.9-4.63h4.53l-.9 4.63z"/>
      </svg>
    ),
  },
  linear: {
    bg: "bg-[#5E6AD2]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M3.36 6.3a10.5 10.5 0 0114.34-2.94l-11.4 11.4A10.45 10.45 0 013.36 6.3zm2.38 10.26L17.7 4.6a10.5 10.5 0 012.94 14.34L8.68 6.98a10.5 10.5 0 01-2.94 9.58z" opacity="0.5"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    ),
  },
  jira: {
    bg: "bg-[#0052CC]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M12.005 2L5.235 8.77a3.06 3.06 0 000 4.33l6.77 6.77 6.77-6.77a3.06 3.06 0 000-4.33L12.005 2zm0 4.33L15.675 10l-3.67 3.67L8.335 10l3.67-3.67z"/>
      </svg>
    ),
  },
  asana: {
    bg: "bg-[#F06A6A]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <circle cx="12" cy="7" r="4"/>
        <circle cx="6" cy="16" r="4"/>
        <circle cx="18" cy="16" r="4"/>
      </svg>
    ),
  },
  "github-issues": {
    bg: "bg-[#24292F]",
    svg: (
      <svg viewBox="0 0 24 24" fill="white" className="size-4">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  slack: {
    bg: "bg-[#4A154B]",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <path d="M6 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1 0A1.5 1.5 0 008.5 16v4.5a1.5 1.5 0 01-3 0V16A1.5 1.5 0 017 14.5z" fill="#E01E5A"/>
        <path d="M9.5 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 1A1.5 1.5 0 008 8.5v4.5a1.5 1.5 0 003 0V8.5A1.5 1.5 0 009.5 7z" fill="#36C5F0"/>
        <path d="M18 9.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm-1 0A1.5 1.5 0 0015.5 8H11a1.5 1.5 0 000 3h4.5A1.5 1.5 0 0017 9.5z" fill="#2EB67D"/>
        <path d="M14.5 18a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0-1a1.5 1.5 0 001.5-1.5V11a1.5 1.5 0 00-3 0v4.5A1.5 1.5 0 0014.5 17z" fill="#ECB22E"/>
      </svg>
    ),
  },
};

export function ConnectorLogo({
  connectorId,
  name,
  category,
  size = "md",
}: {
  connectorId: string;
  name: string;
  category?: string;
  size?: "sm" | "md" | "lg";
}) {
  const logo = LOGOS[connectorId] ?? (category === "repo" ? LOGOS.github : null);
  const sizeClass = size === "sm" ? "size-6 rounded-md" : size === "lg" ? "size-10 rounded-xl" : "size-8 rounded-lg";

  if (logo) {
    return (
      <div className={cn("flex shrink-0 items-center justify-center", sizeClass, logo.bg)}>
        {logo.svg}
      </div>
    );
  }

  const fallbackBg = category === "source" ? "bg-teal-500" : category === "output" ? "bg-indigo-500" : "bg-gray-500";
  return (
    <div className={cn("flex shrink-0 items-center justify-center text-[10px] font-bold text-white", sizeClass, fallbackBg)}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
