import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ResponderNav } from "@/components/layout/responder-nav";
import { IncomingCall } from "@/features/dispatch/responder";

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-28">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <Brand />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[10px] font-medium text-muted-foreground hover:text-primary"
            >
              Demo identity
            </Link>
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
