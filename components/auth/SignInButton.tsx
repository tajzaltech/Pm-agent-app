"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useThemeStore } from "@/lib/store/theme";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function SignInButton({ className, children }: Props) {
  const router = useRouter();
  const completeSetup = useOnboardingStore((s) => s.markSetupDone);
  const defaultLanding = useThemeStore((s) => s.defaultLanding);

  const handleSignIn = () => {
    completeSetup();
    router.replace(defaultLanding);
    router.refresh();
  };

  return (
    <button type="button" className={className} onClick={handleSignIn}>
      {children}
    </button>
  );
}
