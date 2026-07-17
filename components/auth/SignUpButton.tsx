"use client";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useOnboardingStore } from "@/lib/store/onboarding";

type Props = {
  className?: string;
  children: React.ReactNode;
};

/** Starts a new workspace setup — only used from signup, not sign-in. */
export function SignUpButton({ className, children }: Props) {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const beginSignup = useOnboardingStore((s) => s.beginSignup);

  const handleSignUp = () => {
    beginSignup();
    signIn();
    router.push("/onboarding");
  };

  return (
    <button type="button" className={className} onClick={handleSignUp}>
      {children}
    </button>
  );
}
