import { Sidebar, MobileNavigation } from "@/components/layout/sidebar";
import { CommanderHeader } from "@/components/layout/commander-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="md:pl-60">
        <CommanderHeader />
        <MobileNavigation />
        <main
          id="main"
          className="page-content has-[.disaster-explorer]:max-w-none has-[.disaster-explorer]:p-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
