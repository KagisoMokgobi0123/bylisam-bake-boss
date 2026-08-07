export function currency(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `R${n.toFixed(2)}`;
}

export type OrderStatus = "pending" | "approved" | "ready" | "collected" | "cancelled";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order received",
  approved: "Approved",
  ready: "Ready for collection",
  collected: "Order completed",
  cancelled: "Cancelled",
};

/** Label for the admin's single progression button at each stage. */
export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Approve",
  approved: "Ready for collection",
  ready: "Order completed",
};

export const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-warning/20 text-warning-foreground border-warning/40",
  approved: "bg-info/15 text-info border-info/40",
  ready: "bg-accent text-accent-foreground border-accent",
  collected: "bg-success/15 text-success border-success/40",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "approved",
  approved: "ready",
  ready: "collected",
};

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
