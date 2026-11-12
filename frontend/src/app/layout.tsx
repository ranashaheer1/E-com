import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { StorefrontChrome } from "@/components/layout/StorefrontChrome";

/**
 * Self-hosted — avoids next/font/google build flake on Vercel
 * (Google sometimes returns extensionless /l/font?kit= URLs → loader crash).
 */
const display = localFont({
  src: [
    { path: "./fonts/syne-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/syne-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/syne-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    { path: "./fonts/outfit-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/outfit-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/outfit-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/outfit-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/outfit-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNKNOWN — Virtual Store",
  description:
    "UNKNOWN virtual clothing store — hanging rack apparel, retail shoe shelves, and live bag checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AppProviders>
          <StorefrontChrome>{children}</StorefrontChrome>
        </AppProviders>
      </body>
    </html>
  );
}
