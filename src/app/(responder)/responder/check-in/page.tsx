import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckInForm } from "@/features/check-ins/check-in-form";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ConnectionStatus } from "@/components/shared/connection-status";

export const metadata: Metadata = { title: "Safety check-in" };
export default function CheckInPage() {
  return (
    <>
      <Link
        href="/responder"
        className="inline-flex min-h-8 items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Responder home
      </Link>
      <div>
        <h1 className="page-title">Safety check-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A quick update helps your team look after you.
        </p>
      </div>
      <DemoBanner responder />
      <ConnectionStatus />
      <CheckInForm />
    </>
  );
}
