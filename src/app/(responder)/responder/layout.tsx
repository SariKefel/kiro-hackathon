import { DemoTourButton } from "@/features/demo-tour/demo-tour";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ResponderNav } from "@/components/layout/responder-nav";
import { IncomingCall } from "@/features/dispatch/responder";

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-28">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4 sm:px-5">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/login"
              aria-label="Switch demo view"
              title="Switch demo view"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-primary sm:w-auto sm:px-2"
            >
              <ArrowLeftRight aria-hidden="true" className="size-4 sm:hidden" />
              <span className="hidden sm:inline">Switch view</span>
            </Link>
            <DemoTourButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-xl space-y-5 px-5 py-6 sm:py-8">
        {children}
      </main>
      <ResponderNav />
      <IncomingCall />
    </div>
  );
}
