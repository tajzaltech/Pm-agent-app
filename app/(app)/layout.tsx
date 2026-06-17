import { Sidebar } from "@/components/shared/Sidebar";
import { SetupGuard } from "@/components/shared/SetupGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(160deg, #ffffff 0%, #ffffff 60%, #ede9fe 100%)" }}>
        {/* Right bottom violet glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute bottom-0 right-0 size-[480px] rounded-full bg-violet-200/30 blur-[130px]" />
        </div>
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto">{children}</main>
      </div>
    </SetupGuard>
  );
}
