import type { Metadata } from "next";
import { Urbanist, JetBrains_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LightModeOnly } from "@/components/shared/LightModeOnly";

const urbanist = Urbanist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ask PM",
  description:
    "PM Agent connects customer support tickets to your codebase and drafts dev-ready engineering tickets for review.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${jetbrains.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <LightModeOnly>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </LightModeOnly>
      </body>
    </html>
  );
}
