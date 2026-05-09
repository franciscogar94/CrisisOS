import type { Metadata } from "next";

import { Inter, JetBrains_Mono } from "next/font/google";
import { CopilotKitProviderShell } from "@/components/copilot/CopilotKitProviderShell";
import { LocaleProvider } from "@/lib/i18n/context";
import "./globals.css";
// v2 owns its own stylesheet. Do NOT import @copilotkit/react-ui/styles.css —
// v1's .copilotKitButton / .copilotKitSidebar / .copilotKitWindow rules
// collide with v2's same-name selectors (different DOM, different positioning)
// and break the sidebar layout when both are loaded.
import "@copilotkit/react-core/v2/styles.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "CrisisOS — generative war-room",
  description:
    "CrisisOS — generative UI workspace for emergency management. Map, evac checklist, resources, alerts, timeline assembled in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark`}>
      <body className={`${inter.variable} ${jetbrains.variable} subpixel-antialiased`}>
        <LocaleProvider>
          <CopilotKitProviderShell>{children}</CopilotKitProviderShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
