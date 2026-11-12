"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage, updateAdminProfile } from "@/lib/api";
import { adminCardClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const { user, setUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    bio: user?.bio || "",
    currentPassword: "",
    password: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateAdminProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        avatar: form.avatar,
        bio: form.bio,
        ...(form.password
          ? { password: form.password, currentPassword: form.currentPassword }
          : {}),
      });
      setUserProfile({
        ...updated,
        token: user?.token,
      });
      setForm((f) => ({ ...f, password: "", currentPassword: "" }));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
      <div className={`${adminCardClass} p-6 text-center`}>
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-coral to-teal text-3xl font-semibold text-white">
          {form.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (form.name || "A").slice(0, 1).toUpperCase()
          )}
        </div>
        <h2 className="mt-4 font-display text-xl text-ink">{form.name || "Admin"}</h2>
        <p className="mt-1 text-sm text-muted">{form.email}</p>
        <p className="mt-3 rounded-full bg-[rgba(11,79,84,0.1)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal">
          ERP Admin
        </p>
        {form.bio && <p className="mt-4 text-sm text-ink/70">{form.bio}</p>}
      </div>

      <form onSubmit={onSubmit} className={`${adminCardClass} space-y-4 p-6`}>
        <h3 className="font-display text-lg text-ink">Account details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+92..."
            />
          </div>
          <div>
            <Label htmlFor="avatar">Photo URL</Label>
            <Input
              id="avatar"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="/uploads/admin.jpg or https://..."
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </div>
        <div className="grid gap-4 border-t border-[rgba(11,79,84,0.08)] pt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Only if changing password"
            />
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="rounded-xl bg-teal text-white">
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
