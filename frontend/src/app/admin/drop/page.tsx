"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAdminProduct,
  fetchProducts,
  getErrorMessage,
  updateAdminProduct,
} from "@/lib/api";
import type { Product, ProductCategory } from "@/lib/types";
import { adminCardClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: ProductCategory[] = [
  "shirts",
  "t-shirts",
  "pants",
  "trousers",
  "jackets",
  "hoodies",
  "shoes",
  "cargo-pants",
];

export default function AdminDropPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "shirts" as ProductCategory,
    price: "",
    compareAtPrice: "",
    description: "New Season Drop piece",
    images: "/products/hanging/shirts/tee4-front-ghost.png",
    sizes: "S:10,M:10,L:10,XL:10",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const featured = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  const toggleFeatured = async (product: Product) => {
    try {
      const updated = await updateAdminProduct(product._id, {
        featured: !product.featured,
      });
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success(
        updated.featured ? "Added to New Season Drop" : "Removed from Drop"
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sizes = form.sizes
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const [size, stockRaw] = part.split(":").map((s) => s.trim());
          return { size, stock: Number(stockRaw ?? 10) || 0 };
        });
      const created = await createAdminProduct({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        description: form.description,
        images: form.images.split(/[\s,]+/).filter(Boolean),
        sizes,
        featured: true,
      } as Partial<Product>);
      setProducts((prev) => [created, ...prev]);
      setForm((f) => ({ ...f, name: "", price: "", compareAtPrice: "" }));
      toast.success("Drop product created & featured");
    } catch (error) {
      toast.error(getErrorMessage(error, "Create failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${adminCardClass} p-5 sm:p-6`}>
        <h2 className="font-display text-xl text-ink">Add to New Season Drop</h2>
        <p className="mt-1 text-sm text-muted">
          Create a product and pin it as <strong>featured</strong> for the home Drop
          rail — name, price, images, sizes, category.
        </p>
        <form onSubmit={onCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="UNKNOWN Coral Mark Tee"
            />
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as ProductCategory })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Price (PKR)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Compare-at price</Label>
            <Input
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
            />
          </div>
          <div>
            <Label>Sizes (S:10,M:10…)</Label>
            <Input
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Image paths (space or comma separated)</Label>
            <Input
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={saving} className="rounded-xl bg-teal text-white sm:col-span-2">
            {saving ? "Saving..." : "Create & feature on Drop"}
          </Button>
        </form>
      </div>

      <div className={`${adminCardClass} overflow-hidden`}>
        <div className="border-b border-[rgba(11,79,84,0.08)] px-5 py-4">
          <h3 className="font-display text-lg">
            Currently on Drop ({featured.length})
          </h3>
          <p className="text-xs text-muted">Toggle any catalog product into the Drop rail.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(11,79,84,0.08)] text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Featured</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-b border-[rgba(11,79,84,0.06)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt=""
                          className="h-12 w-10 rounded-md object-contain bg-ivory-soft"
                        />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize">{p.category}</td>
                    <td className="px-3 py-3">{formatPrice(p.price)}</td>
                    <td className="px-3 py-3">
                      {p.featured ? (
                        <span className="rounded-full bg-[rgba(11,79,84,0.12)] px-2.5 py-1 text-xs text-teal">
                          On Drop
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Off</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(p)}
                        className="rounded-lg border border-[rgba(11,79,84,0.15)] px-3 py-1.5 text-xs font-medium hover:bg-ivory-soft"
                      >
                        {p.featured ? "Remove from Drop" : "Add to Drop"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
