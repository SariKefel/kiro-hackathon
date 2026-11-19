"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="mx-auto max-w-md px-6 py-24">
      <TriangleAlert className="mb-5 size-9 text-caution" />
      <h1 className="text-2xl font-semibold tracking-tight">This view could not load</h1>
      <p className="my-5 text-sm leading-7 text-muted-foreground">
        Retry this view. If you are offline, keep any open check-in form available. Reports already
        saved on this device remain in browser storage.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
