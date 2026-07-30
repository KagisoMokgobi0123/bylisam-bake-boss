import { currency, formatDate } from "./format";

export type ReceiptOrder = {
  reference: string;
  customer_name: string;
  phone: string | null;
  is_student: boolean;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  collected_at?: string | null;
};

export type ReceiptItem = {
  muffin_name: string;
  quantity: number;
  unit_price: number;
};

export function buildReceiptText(
  order: ReceiptOrder,
  items: ReceiptItem[],
  businessName = "BYLISAM",
) {
  const lines = items.map(
    (i) => `• ${i.quantity} × ${i.muffin_name} — ${currency(Number(i.unit_price) * i.quantity)}`,
  );
  return [
    `${businessName} receipt`,
    `Order ${order.reference}`,
    formatDate(order.collected_at ?? order.created_at),
    "",
    ...lines,
    "",
    `Subtotal: ${currency(order.subtotal)}`,
    ...(Number(order.discount) > 0 ? [`Reward discount: -${currency(order.discount)}`] : []),
    `Total: ${currency(order.total)}`,
    `Payment method: ${order.payment_method.toUpperCase()}`,
  ].join("\n");
}

export function normalisePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

/** Builds a wa.me click-to-chat link with the receipt and thank-you message pre-filled. */
export function buildWhatsAppLink(
  phone: string,
  receipt: string,
  thankYouMessage: string,
) {
  const text = `${thankYouMessage}\n\n${receipt}`;
  return `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export const DEFAULT_THANK_YOU =
  "Thank you for supporting BYLISAM! 🧁 Your order has been collected successfully. We truly appreciate your support and hope you enjoy your freshly baked muffins. We look forward to serving you again soon!";
