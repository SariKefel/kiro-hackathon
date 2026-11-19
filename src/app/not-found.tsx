import Link from "next/link";
import { RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-md px-6 py-24">
      <RadioTower className="mb-6 size-9 text-signal-text" />
      <h1 className="text-2xl">Let&apos;s get you back to your team</h1>
      <p className="mt-2 text-sm font-medium text-ink-2">Error 404: view unavailable</p>
      <p className="my-5 text-sm leading-7 text-muted-foreground">
        This page or incident could not be found. Choose a response view to continue.
      </p>
      <Button asChild>
        <Link href="/">Open RescueSync</Link>
      </Button>
    </main>
  );
}
