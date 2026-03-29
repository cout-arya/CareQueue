"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListOrdered,
  BarChart3,
  Settings,
  Activity,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: UserIcon },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/waitlist", label: "Waitlist", icon: ListOrdered },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-surface-container-low flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-clinical bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-headline text-lg font-bold text-on-surface tracking-tight">
            CareQueue
          </h1>
          <p className="text-[11px] text-on-surface-variant -mt-0.5">
            Smart Clinic Manager
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-clinical text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-ambient"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-3 rounded-clinical bg-surface-container flex flex-col gap-2">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1.5 mb-2 border-b border-outline-variant/30 pb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-on-surface truncate">
                {user.name}
              </p>
              <p className="text-xs text-on-surface-variant uppercase">
                {(user as any).role || "Receptionist"}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/settings"
          className="flex items-center gap-3 px-2 py-1.5 text-sm text-on-surface-variant hover:text-on-surface transition"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-2 py-1.5 text-sm text-error hover:bg-error/10 hover:text-error rounded transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
