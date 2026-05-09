import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ShowcasePage() {
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
        <h1 className="mt-6 text-3xl font-semibold">CrisisOS Component Showcase</h1>
        <p className="mt-2 text-muted-foreground">
          Coming soon — crisis components in isolation.
        </p>
      </div>
    </div>
  );
}
