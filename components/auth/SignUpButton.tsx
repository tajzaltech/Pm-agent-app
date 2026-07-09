"use client";

import { useRouter } from "next/navigation";

import { useOnboardingStore } from "@/lib/store/onboarding";

type Props = {
  className?: string;
  children: React.ReactNode;
};

/** Starts a new workspace setup — only used from signup, not sign-in. */
export function SignUpButton({ className, children }: Props) {
  const router = useRouter();
  const beginSignup = useOnboardingStore((s) => s.beginSignup);

  const handleSignUp = () => {
    beginSignup();
    router.push("/onboarding");
  };

  return (
    <button type="button" className={className} onClick={handleSignUp}>
      {children}
    </button>
  );
}
