"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  LayoutDashboard,
  LifeBuoy,
  RadioTower,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: Waves },
  { href: "/explorer", label: "Disaster Explorer", icon: RadioTower },
  { href: "/personnel", label: "Personnel", icon: Users },
  { href: "/ai-analysis", label: "AI Analysis", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-chrome text-chrome-muted md:fixed md:inset-y-0 md:flex">
      <div className="px-6 pb-6 pt-7">
        <Brand light />
      </div>
      <div className="mx-6 flex items-center gap-3 border-y border-chrome-rule py-3">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-chrome-signal" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-chrome-ink">Selangor Response</p>
          <p className="text-xs">Demo organization</p>
        </div>
      </div>
      <p className="px-6 pb-2 pt-7 text-xs font-medium">Command center</p>
      <nav aria-label="Commander navigation" className="space-y-0.5 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-[var(--dur-micro)] hover:bg-chrome-2 hover:text-chrome-ink focus-visible:outline-chrome-signal active:bg-chrome-active",
              pathname.startsWith(href) &&
                "bg-chrome-active text-chrome-ink hover:bg-chrome-active [&>svg]:text-chrome-signal",
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {label}
            {label === "Incidents" && (
              <span className="figure-mono ml-auto text-xs text-chrome-ink">1</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mx-6 mt-auto mb-5 border-t border-chrome-rule pt-4">
        <p className="flex items-center gap-2 text-sm font-medium text-chrome-ink">
          <RadioTower aria-hidden="true" className="size-4 text-chrome-signal" />
          Built for the field
        </p>
        <p className="mt-1.5 text-xs leading-5">
          Keep check-ins moving, even when the connection stops.
        </p>
        <Link
          href="/responder"
          className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-chrome-signal underline-offset-4 hover:underline focus-visible:outline-chrome-signal"
        >
          Open responder view
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      <Link
        href="/settings#about"
        className="flex min-h-12 items-center gap-2 border-t border-chrome-rule px-6 text-xs hover:text-chrome-ink focus-visible:outline-chrome-signal"
      >
        <LifeBuoy aria-hidden="true" className="size-4" />
        Help & platform info
      </Link>
    </aside>
  );
}
export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Commander navigation"
      className="grid h-16 border-b bg-card px-1 md:hidden"
      style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
    >
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          href={href}
          key={href}
          aria-label={label}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1 border-b-2 border-transparent px-1 text-center text-xs font-medium leading-tight text-muted-foreground transition-colors hover:bg-secondary active:bg-signal-soft",
            pathname.startsWith(href) && "border-signal bg-signal-soft text-signal-text",
          )}
        >
          <Icon aria-hidden="true" className="size-[18px]" />
          <span>{href === "/explorer" ? "Explorer" : label}</span>
        </Link>
      ))}
    </nav>
  );
}
