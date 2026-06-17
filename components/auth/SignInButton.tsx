"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function SignInButton({ className, children }: Props) {
  const router = useRouter();
  const completeSetup = useOnboardingStore((s) => s.markSetupDone);

  const handleSignIn = () => {
    // Mark onboarding complete so SetupGuard doesn't redirect returning users
    completeSetup();
    router.push("/queue");
  };

  return (
    <button type="button" className={className} onClick={handleSignIn}>
      {children}
    </button>
  );
}
