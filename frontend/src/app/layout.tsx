import type { Metadata } from "next";
import { Syne, Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { StorefrontChrome } from "@/components/layout/StorefrontChrome";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
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
