"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CategoryNavProvider } from "@/context/CategoryNavContext";
import { CartUIProvider } from "@/context/CartUIContext";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <CategoryNavProvider>
            <CartUIProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </CartUIProvider>
          </CategoryNavProvider>
        </Suspense>
      </CartProvider>
    </AuthProvider>
  );
}
