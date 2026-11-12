"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const { user, loading, adminLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@unknown.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminLogin(password, email);
      toast.success("Welcome back");
      router.replace("/admin");
    } catch (error) {
      toast.error(getErrorMessage(error, "Admin login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-[rgba(11,79,84,0.1)] bg-white/90 p-8 shadow-[0_20px_50px_rgba(8,59,63,0.1)]"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal font-display tracking-[0.18em] text-white">
            UN
          </div>
          <h1 className="font-display text-2xl tracking-[0.2em]">UNKNOWN</h1>
          <p className="mt-2 text-sm text-muted">Admin dashboard sign in</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="mt-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ADMIN_PASSWORD or Admin123!"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Enter dashboard"}
          </Button>
        </div>
      </form>
    </div>
  );
}
