"use client";

/**
 * CopilotKitProviderShell — client-side wrapper around CopilotKitProvider.
 *
 * Why this lives in its own file: the provider config can carry non-plain
 * values (component refs, etc.) that can't be serialized across the
 * server→client boundary if registered directly inside the root
 * server-component layout. Wrapping the provider in this client component
 * keeps that wiring client-side, and the server layout just renders
 * <CopilotKitProviderShell>{children}</…>.
 *
 * The tool-call wildcard renderer lives inside the leads page via
 * `useDefaultRenderTool`, so any tool call without a dedicated render slot
 * surfaces as a small CopilotKit-branded card. No registry needed here.
 */

import { useEffect } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { installFetchLogger } from "@/lib/fetch-logger";
import { installConsoleNoiseFilter } from "@/lib/console-filter";

const GEMINI_DIRECT = process.env.NEXT_PUBLIC_DEMO_MODE === "gemini";

export function CopilotKitProviderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (GEMINI_DIRECT) {
      installConsoleNoiseFilter();
      return;
    }
    installFetchLogger();
  }, []);

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={{ "ngrok-skip-browser-warning": "1" }}
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY}
      openGenerativeUI={{}}
    >
      {children}
    </CopilotKitProvider>
  );
}
