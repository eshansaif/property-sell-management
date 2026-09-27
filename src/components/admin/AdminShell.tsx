"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Dashboard", perm: null },
  { href: "/admin/services", label: "Services", perm: "service:read" },
  { href: "/admin/sub-services", label: "Sub-services", perm: "subservice:read" },
  { href: "/admin/listings", label: "Listings", perm: "listing:read" },
  { href: "/admin/inquiries", label: "Inquiries", perm: "inquiry:read" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="font-display text-lg text-text-primary">Admin</Link>
        </div>
        <nav className="space-y-1 p-4">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
          <p className="text-sm text-text-secondary">
            {session?.user?.name} <span className="ml-1 text-xs text-text-secondary/70">({session?.user?.role})</span>
          </p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">View site</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="btn-outline !px-3 !py-1.5 text-xs"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
