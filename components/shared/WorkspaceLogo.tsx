"use client";

import type { Workspace } from "@/lib/mock/workspaces";

interface WorkspaceLogoProps {
  workspace: Workspace;
  size?: number;
  className?: string;
}

export function WorkspaceLogo({ workspace, size = 28, className }: WorkspaceLogoProps) {
  const gradientId = `wg-${workspace.id}`;
  const [from, to] = workspace.gradient;
  const rx = size <= 24 ? 6 : 8;
  const fontSize = size <= 24 ? 9 : 10.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2={String(size)} y2={String(size)} gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width={size} height={size} rx={rx} fill={`url(#${gradientId})`} />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing="0.5"
        fontFamily="var(--font-sans), system-ui, sans-serif"
      >
        {workspace.initials}
      </text>
    </svg>
  );
}
