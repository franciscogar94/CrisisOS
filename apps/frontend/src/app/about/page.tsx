import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "About — CrisisOS",
  description: "AI-powered crisis management workspace.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to canvas
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">CrisisOS</h1>
        <p className="mt-2 text-muted-foreground">
          Describe an emergency. The agent generates an interactive operations center
          in real time — maps, evacuation checklists, resource inventory, service
          alerts, and action timelines.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Built at the Generative UI Global Hackathon, May 9, 2026 — team Tesla Model 3.
        </p>
      </div>
    </div>
  );
}
