import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Smartphone } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Choose a demo identity" };
export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Brand />
      <h1 className="mb-3 mt-10 text-3xl font-semibold tracking-tight">Choose a demo identity</h1>
      <p className="mb-8 text-sm leading-7 text-muted-foreground">
        Explore RescueSync with sample data. Production authentication will use Better Auth with
        organization-scoped access.
      </p>
      <div className="space-y-3">
        <Button asChild className="h-auto w-full justify-start gap-4 py-4">
          <Link href="/dashboard">
            <LayoutDashboard className="size-5" />
            <span>
              <span className="block">Nadia Rahman</span>
              <span className="mt-1 block text-xs font-normal">Demo incident commander</span>
            </span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-auto w-full justify-start gap-4 bg-card py-4"
        >
          <Link href="/responder">
            <Smartphone className="size-5" />
            <span>
              <span className="block">Amir Hassan</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Demo field responder
              </span>
            </span>
          </Link>
        </Button>
      </div>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowLeft className="size-4" />
        Back to RescueSync
      </Link>
    </main>
  );
}
