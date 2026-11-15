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
    <aside className="hidden w-[238px] shrink-0 flex-col bg-[#142537] text-[#adbdcd] md:fixed md:inset-y-0 md:flex">
      <div className="px-6 pb-7 pt-7">
        <Brand light />
      </div>
      <div className="mx-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-100">Selangor Response</p>
          <p className="mt-1 text-[10px]">Demo organization</p>
        </div>
      </div>
      <p className="px-7 pb-3 pt-8 text-[11px] font-medium text-slate-400">Command center</p>
      <nav aria-label="Commander navigation" className="space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] font-medium transition-colors hover:bg-white/5 hover:text-white",
              pathname.startsWith(href) &&
                "bg-[#254244] text-[#9de7d4] hover:bg-[#254244] hover:text-[#9de7d4]",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
            {label === "Incidents" && (
              <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">1</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mx-5 mt-auto mb-5 rounded-lg border border-white/10 p-4">
        <RadioTower className="mb-2 size-5 text-teal-300" />
        <p className="text-xs font-medium text-slate-100">Built for the field</p>
        <p className="mt-1.5 text-[11px] leading-relaxed">
          Keep check-ins moving, even when the connection stops.
        </p>
        <Link
          href="/responder"
          className="mt-3 flex min-h-8 items-center gap-2 text-xs font-medium text-teal-200"
        >
          Open responder view
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      <Link
        href="/settings#about"
        className="flex items-center gap-2 border-t border-white/10 px-7 py-5 text-xs hover:text-white"
      >
        <LifeBuoy className="size-4" />
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
            "flex min-w-0 flex-col items-center justify-center gap-1 border-b-2 border-transparent px-1 text-center text-[11px] font-medium leading-tight text-muted-foreground transition-colors hover:bg-secondary",
            pathname.startsWith(href) &&
              "border-primary bg-primary/5 font-semibold text-primary dark:text-teal-300",
          )}
        >
          <Icon aria-hidden="true" className="size-[18px]" />
          <span>{href === "/explorer" ? "Explorer" : label}</span>
        </Link>
      ))}
    </nav>
  );
}
