import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden text-[#f6f0e6]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 12% 0%, rgba(232,93,76,0.35), transparent 55%), radial-gradient(70% 50% at 88% 100%, rgba(20,104,110,0.45), transparent 50%), linear-gradient(155deg, #062f32 0%, #083b3f 42%, #0b4f54 78%, #14686e 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
          backgroundSize: "160px 160px",
          mixBlendMode: "soft-light",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl tracking-brand text-[#fff8ef]">
            UNKNOWN
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#d7cfc2]">
            Virtual store experience — rail hangers, shoe racks, and a live
            shopping bag.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#f07868]">
            Shop
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-[#e8dfd2]">
            <Link href="/full-fit" className="transition hover:text-white">
              Full Fit
            </Link>
            <Link href="/shirts" className="transition hover:text-white">
              Shirts
            </Link>
            <Link href="/pants" className="transition hover:text-white">
              Pants
            </Link>
            <Link href="/hoodies" className="transition hover:text-white">
              Hoodies
            </Link>
            <Link href="/shoes" className="transition hover:text-white">
              Shoes
            </Link>
            <Link href="/jackets" className="transition hover:text-white">
              Jackets
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#f07868]">
            Support
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-[#e8dfd2]">
            <Link href="/auth" className="transition hover:text-white">
              Account
            </Link>
            <Link href="/orders" className="transition hover:text-white">
              Orders
            </Link>
            <Link href="/cart" className="transition hover:text-white">
              Cart
            </Link>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs text-[#b9b0a2]">
        © {new Date().getFullYear()} UNKNOWN. All rights reserved.
      </div>
    </footer>
  );
}
