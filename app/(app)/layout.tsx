import { AppShell } from "@/components/shared/AppShell";
import { ApiHydrator } from "@/components/shared/ApiHydrator";
import { SetupGuard } from "@/components/shared/SetupGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupGuard>
      <ApiHydrator />
      <AppShell>{children}</AppShell>
    </SetupGuard>
  );
}
