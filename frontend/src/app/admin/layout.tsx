"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (loading || isLogin) return;
    if (!user || user.role !== "admin") {
      router.replace("/admin/login");
    }
  }, [user, loading, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-muted">
        Checking admin access...
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
