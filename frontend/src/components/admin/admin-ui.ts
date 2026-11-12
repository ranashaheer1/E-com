import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/orderStatus";

export function statusBadgeClass(status: string) {
  const tone = statusTone(status);
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
    tone === "pending" && "bg-[rgba(232,147,76,0.16)] text-[#c46a1f]",
    tone === "progress" && "bg-[rgba(232,93,76,0.14)] text-[#d24535]",
    tone === "completed" && "bg-[rgba(11,79,84,0.12)] text-[#0b4f54]",
    tone === "cancelled" && "bg-black/5 text-muted",
    tone === "neutral" && "bg-black/5 text-ink"
  );
}

export const adminCardClass =
  "rounded-2xl border border-[rgba(11,79,84,0.08)] bg-white shadow-[0_10px_30px_rgba(8,59,63,0.06)]";
