"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function AuthForm() {
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back");
      } else {
        await register(form.name, form.email, form.password);
        toast.success("Account created");
      }
      router.push(redirect);
    } catch (error) {
      toast.error(getErrorMessage(error, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-display text-3xl tracking-[0.22em]">
        {mode === "login" ? "SIGN IN" : "REGISTER"}
      </h1>
      <p className="mt-3 text-center text-sm text-neutral-500">
        Demo: demo@unknown.com / Demo123!
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        {mode === "register" && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-2"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="mt-2"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="mt-2"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        className="mt-6 w-full text-center text-sm text-neutral-500 underline"
        onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
      >
        {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
