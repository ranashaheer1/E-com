"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  Users,
  Sparkles,
  UserRound,
  ExternalLink,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminNotifications, getErrorMessage } from "@/lib/api";
import type { AdminNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/drop", label: "New Season Drop", icon: Sparkles },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const seenIds = useRef<Set<string>>(new Set());
  const bootstrapped = useRef(false);

  const title = useMemo(() => {
    if (pathname?.startsWith("/admin/products")) return "Products";
    if (pathname?.startsWith("/admin/orders")) return "Orders";
    if (pathname?.startsWith("/admin/drop")) return "New Season Drop";
    if (pathname?.startsWith("/admin/customers")) return "Customers";
    if (pathname?.startsWith("/admin/profile")) return "Profile";
    return "Overview";
  }, [pathname]);

  const loadNotifications = async (announce: boolean) => {
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data.items || []);
      setUnread(data.unread || 0);
      if (announce && bootstrapped.current) {
        for (const item of data.items || []) {
          if (item.unread && !seenIds.current.has(item._id)) {
            toast.message(item.title, { description: item.message });
            seenIds.current.add(item._id);
          }
        }
      } else {
        (data.items || []).forEach((item) => seenIds.current.add(item._id));
        bootstrapped.current = true;
      }
    } catch (error) {
      if (announce) toast.error(getErrorMessage(error, "Notifications failed"));
    }
  };

  useEffect(() => {
    loadNotifications(false);
    const id = setInterval(() => loadNotifications(true), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/admin/orders?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="admin-shell min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[rgba(11,79,84,0.1)] bg-white/95 px-4 py-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between gap-3 px-2">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-sm font-display tracking-[0.18em] text-white">
                UN
              </span>
              <span className="font-display text-lg tracking-[0.28em]">UNKNOWN</span>
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-muted lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Main menu
          </p>
          <nav className="mt-3 space-y-1">
            {nav.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[rgba(11,79,84,0.1)] text-teal"
                      : "text-ink/70 hover:bg-ivory-soft hover:text-ink"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 px-1 pt-8">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink/70 hover:bg-ivory-soft"
            >
              <ExternalLink size={16} />
              Open storefront
            </Link>
            <div className="rounded-2xl bg-gradient-to-br from-[rgba(232,147,76,0.18)] via-[rgba(232,93,76,0.12)] to-[rgba(11,79,84,0.14)] p-4">
              <p className="font-display text-sm text-ink">Need help?</p>
              <p className="mt-1 text-xs text-muted">
                Orders, Drop products, and profile live in this portal.
              </p>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="mt-3 w-full rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white"
              >
                Open help guide
              </button>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-coral hover:bg-[rgba(232,93,76,0.08)]"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {open && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[rgba(11,79,84,0.08)] bg-[rgba(250,246,240,0.86)] px-4 py-4 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              className="rounded-xl border border-[rgba(11,79,84,0.12)] bg-white p-2 text-ink lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-xl text-ink sm:text-2xl">{title}</h1>
              <p className="truncate text-xs text-muted">
                {user?.name || "Admin"} · {user?.email}
              </p>
            </div>
            <form onSubmit={onSearch} className="ml-auto hidden max-w-md flex-1 md:block">
              <label className="relative block">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, products, or customers..."
                  className="h-11 w-full rounded-full border border-[rgba(11,79,84,0.1)] bg-white pl-10 pr-4 text-sm outline-none focus:border-teal"
                />
              </label>
            </form>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-[rgba(11,79,84,0.1)] bg-white text-muted sm:inline-flex"
                aria-label="Help"
              >
                <HelpCircle size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  loadNotifications(false);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(11,79,84,0.1)] bg-white text-muted"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              <Link
                href="/admin/profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-coral to-teal text-xs font-semibold text-white"
                aria-label="Open profile"
              >
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user?.name || "A").slice(0, 1).toUpperCase()
                )}
              </Link>

              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-[rgba(11,79,84,0.1)] bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-[rgba(11,79,84,0.08)] px-4 py-3">
                    <p className="text-sm font-medium">Notifications</p>
                    <button
                      type="button"
                      className="text-xs text-teal"
                      onClick={() => router.push("/admin/orders")}
                    >
                      View orders
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-muted">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            router.push(n.href || "/admin/orders");
                          }}
                          className="flex w-full flex-col gap-0.5 border-b border-[rgba(11,79,84,0.06)] px-4 py-3 text-left hover:bg-ivory-soft"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            {n.unread && (
                              <span className="h-2 w-2 rounded-full bg-coral" />
                            )}
                            {n.title}
                          </span>
                          <span className="text-xs text-muted">{n.message}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-ink">Admin help</h2>
                <p className="mt-1 text-sm text-muted">
                  Quick guide for running UNKNOWN store ops.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-ivory-soft"
                onClick={() => setHelpOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-ink/80">
              <li>
                <strong>Dashboard period</strong> — switch This Month / Last Month /
                This Year to refresh KPIs, chart, and recent sales.
              </li>
              <li>
                <strong>New Season Drop</strong> — mark products as featured so they
                appear on the home Drop rail.
              </li>
              <li>
                <strong>Orders</strong> — guest checkouts appear here without customer
                login. Update Pending → Processing → Completed.
              </li>
              <li>
                <strong>Notifications</strong> — new / pending orders ping the bell and
                toast when they arrive.
              </li>
              <li>
                <strong>Profile</strong> — update name, photo URL, phone, bio, and
                password.
              </li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-teal py-2.5 text-sm font-medium text-white"
              onClick={() => setHelpOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
