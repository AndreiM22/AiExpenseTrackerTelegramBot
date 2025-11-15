import { HeaderBar } from "./HeaderBar";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  userName: string;
};

export function DashboardShell({ children, userName }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <HeaderBar userName={userName} />
          <main className="px-4 py-8 text-white sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
