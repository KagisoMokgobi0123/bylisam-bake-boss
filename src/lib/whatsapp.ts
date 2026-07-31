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

/** Optional WhatsApp numbers are only validated when the customer actually enters one. */
export function isValidWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

/** Absolute link to the public feedback page, built from the running app's URL. */
export function feedbackLink() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/feedback`;
}

export const FEEDBACK_INVITE =
  "We'd love to hear your feedback! Please leave us a review here:";

/** Appends the friendly feedback invitation + link to any customer WhatsApp message. */
export function withFeedbackInvite(message: string, link = feedbackLink()) {
  return `${message}\n\n${FEEDBACK_INVITE} ${link}`;
}

/** Builds a wa.me click-to-chat link with the receipt and thank-you message pre-filled. */
export function buildWhatsAppLink(
  phone: string,
  receipt: string,
  thankYouMessage: string,
) {
  const text = withFeedbackInvite(`${thankYouMessage}\n\n${receipt}`);
  return `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(text)}`;
}

/** Click-to-chat link for a short status / collection update message. */
export function buildWhatsAppMessageLink(phone: string, message: string) {
  return `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(
    withFeedbackInvite(message),
  )}`;
}

export function statusUpdateMessage(
  reference: string,
  statusLabel: string,
  businessName = "BYLISAM",
) {
  return `Hi from ${businessName}! 🧁 Your order ${reference} is now: ${statusLabel}.`;
}

export const DEFAULT_THANK_YOU =
  "Thank you for supporting BYLISAM! 🧁 Your order has been collected successfully. We truly appreciate your support and hope you enjoy your freshly baked muffins. We look forward to serving you again soon!";
