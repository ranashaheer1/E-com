"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchProducts,
  getErrorMessage,
  updateAdminProduct,
} from "@/lib/api";
import type { Product, ProductCategory, SizeStock } from "@/lib/types";
import { adminCardClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: ProductCategory[] = [
  "shirts",
  "pants",
  "shoes",
  "cargo-pants",
  "trousers",
  "t-shirts",
  "jackets",
  "hoodies",
];

const emptyForm = {
  name: "",
  category: "shirts" as ProductCategory,
  price: "",
  compareAtPrice: "",
  description: "",
  images: "",
  sizes: "S:10,M:10,L:10,XL:10",
  featured: false,
  slug: "",
};

function parseSizes(raw: string): SizeStock[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [size, stockRaw] = part.split(":").map((s) => s.trim());
      return { size, stock: Number(stockRaw ?? 10) || 0 };
    })
    .filter((s) => s.size);
}

function sizesToString(sizes: SizeStock[]) {
  return sizes.map((s) => `${s.size}:${s.stock}`).join(",");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");

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

  const filtered = useMemo(
    () =>
      filter === "all"
        ? products
        : products.filter((p) => p.category === filter),
    [products, filter]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      description: product.description,
      images: product.images.join(", "),
      sizes: sizesToString(product.sizes || []),
      featured: Boolean(product.featured),
      slug: product.slug || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const images = form.images
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!images.length) {
      toast.error("Add at least one image URL or path");
      return;
    }
    const sizes = parseSizes(form.sizes);
    if (!sizes.length) {
      toast.error("Add sizes like S:10,M:8");
      return;
    }

    const payload: Partial<Product> = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      description: form.description,
      images,
      sizes,
      featured: form.featured,
      slug: form.slug || undefined,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateAdminProduct(editingId, payload);
        toast.success("Product updated");
      } else {
        await createAdminProduct(payload);
        toast.success("Product created");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteAdminProduct(id);
      toast.success("Product deleted");
      if (editingId === id) resetForm();
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete failed"));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className={`${adminCardClass} space-y-4 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">
              {editingId ? "Edit product" : "Add product"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Fields mirror the Product model — name, price, category, images, sizes, stock.
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="mt-2 flex h-11 w-full rounded-md border border-black/15 bg-white/70 px-4 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as ProductCategory,
                }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              className="mt-2"
              required
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="compareAtPrice">Compare-at / sale price</Label>
            <Input
              id="compareAtPrice"
              className="mt-2"
              type="number"
              min="0"
              value={form.compareAtPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, compareAtPrice: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              className="mt-2"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto from name if empty"
            />
          </div>
          <div>
            <Label htmlFor="sizes">Sizes & stock</Label>
            <Input
              id="sizes"
              className="mt-2"
              required
              value={form.sizes}
              onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
              placeholder="S:10,M:8,L:5"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="images">Image URLs / paths (comma-separated)</Label>
            <Input
              id="images"
              className="mt-2"
              required
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
              placeholder="/products/hanging/shirts/tee1-front.png"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              required
              rows={3}
              className="mt-2 w-full rounded-md border border-black/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-teal"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((f) => ({ ...f, featured: e.target.checked }))
              }
            />
            Featured on storefront
          </label>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update product" : "Create product"}
        </Button>
      </form>

      <div className={`${adminCardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(11,79,84,0.08)] px-5 py-4">
          <h3 className="font-display text-lg">Catalog</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(11,79,84,0.08)] text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const stock = product.sizes.reduce((n, s) => n + s.stock, 0);
                  return (
                    <tr
                      key={product._id}
                      className="border-b border-[rgba(11,79,84,0.06)] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.images[0]}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover bg-ivory-deep"
                          />
                          <div>
                            <p className="font-medium text-ink">{product.name}</p>
                            <p className="text-xs text-muted">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 capitalize">{product.category}</td>
                      <td className="px-3 py-4">
                        {formatPrice(product.price)}
                        {product.compareAtPrice ? (
                          <span className="ml-2 text-xs text-muted line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-4">{stock}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(product._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
