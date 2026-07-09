import { AppShell } from "@/components/shared/AppShell";
import { SetupGuard } from "@/components/shared/SetupGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupGuard>
      <AppShell>{children}</AppShell>
    </SetupGuard>
  );
}
