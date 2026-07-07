import { Sidebar } from "@/components/shared/Sidebar";
import { SetupGuard } from "@/components/shared/SetupGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupGuard>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Animated violet mesh blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute bottom-[-80px] right-[-80px] size-[520px] rounded-full bg-violet-300/25 blur-[120px] animate-blob" />
          <div className="absolute bottom-[10%] right-[15%] size-[320px] rounded-full bg-indigo-200/20 blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-40px] right-[30%] size-[250px] rounded-full bg-purple-200/20 blur-[90px] animate-blob animation-delay-4000" />
        </div>
        <Sidebar />
        {/* Mobile: push content below the fixed top bar */}
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pt-14 lg:pt-0">{children}</main>
      </div>
    </SetupGuard>
  );
}
