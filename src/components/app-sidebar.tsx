"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  TreePine,
  Users,
  LogOut,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lands", label: "Lands", icon: TreePine },
  { href: "/plots", label: "Plots", icon: Map },
  { href: "/people", label: "People", icon: Users },
];

export function AppSidebar({ user }: { user: { email: string; name?: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sprout className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">Ziwa CRM</div>
          <div className="text-xs text-muted-foreground">Agriculture</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 px-1">
          <div className="text-sm font-medium truncate">{user.name || user.email}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          <LogOut className="mr-1 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
