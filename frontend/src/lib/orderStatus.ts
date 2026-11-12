import type { OrderStatus } from "./types";

export type StatusTone = "pending" | "progress" | "completed" | "cancelled" | "neutral";

export function normalizeStatus(status: string): OrderStatus | string {
  return status;
}

export function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
    case "shipped":
      return "In Progress";
    case "delivered":
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function statusTone(status: string): StatusTone {
  switch (status) {
    case "pending":
      return "pending";
    case "processing":
    case "shipped":
      return "progress";
    case "delivered":
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "neutral";
  }
}

export const ADMIN_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "In Progress" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
