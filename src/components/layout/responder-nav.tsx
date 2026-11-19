"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResponderNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Responder navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-xl">
        {[
          { href: "/responder", label: "Home", icon: House },
          { href: "/responder/check-in", label: "Check in", icon: Radio },
          { href: "/responder/tasks", label: "Tasks", icon: ClipboardList },
        ].map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[70px] flex-1 flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground",
                active && "font-semibold text-signal-text",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
