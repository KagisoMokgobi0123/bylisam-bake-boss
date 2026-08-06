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
  amount_paid?: number | null;
  cashier_name?: string | null;
  points_awarded?: number | null;
};


export type ReceiptItem = {
  muffin_name: string;
  quantity: number;
  unit_price: number;
};

export type ReceiptBusinessInfo = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  taxRate?: number | null;
  footer?: string | null;
  cashierName?: string | null;
};

const WIDTH = 32;

const rule = (char: string) => char.repeat(WIDTH);

/** Right-aligns a value against a label so the plain-text receipt lines up. */
function row(label: string, value: string) {
  const pad = Math.max(1, WIDTH - label.length - value.length);
  return `${label}${" ".repeat(pad)}${value}`;
}

function itemRow(item: ReceiptItem) {
  const total = currency(Number(item.unit_price) * item.quantity);
  const name = item.muffin_name.length > 16 ? `${item.muffin_name.slice(0, 15)}…` : item.muffin_name;
  return row(`${item.quantity}x ${name}`, total);
}

/** Builds a compact, monospaced till-slip style receipt for WhatsApp. */
export function buildReceiptText(
  order: ReceiptOrder,
  items: ReceiptItem[],
  business: string | ReceiptBusinessInfo = "BYLISAM",
) {
  const info: ReceiptBusinessInfo = typeof business === "string" ? { name: business } : business;
  const name = info.name || "BYLISAM";
  const taxRate = Number(info.taxRate ?? 0);
  const total = Number(order.total);
  const discount = Number(order.discount);
  const tax = taxRate > 0 ? total - total / (1 + taxRate / 100) : 0;
  const paid = order.amount_paid != null ? Number(order.amount_paid) : total;
  const change = Math.max(0, paid - total);
  const contact = [info.phone ? `Tel ${info.phone}` : null, info.address].filter(Boolean).join(" · ");

  const lines = [
    rule("="),
    name.toUpperCase(),
    ...(contact ? [contact] : []),
    rule("-"),
    row(`No ${order.reference}`, formatDate(order.collected_at ?? order.created_at)),
    row(`Cashier ${info.cashierName || order.cashier_name || "BYLISAM"}`, ""),
    ...(order.customer_name ? [row(`Customer ${order.customer_name}`, "")] : []),
    rule("-"),
    ...items.map(itemRow),
    rule("-"),
    row("Subtotal", currency(order.subtotal)),
    ...(discount > 0 ? [row("Discount", `-${currency(discount)}`)] : []),
    ...(taxRate > 0 ? [row(`VAT ${taxRate}%`, currency(tax))] : []),
    row("TOTAL", currency(total)),
    row(`${order.payment_method.toUpperCase()} paid`, currency(paid)),
    row("Change", currency(change)),
    ...(Number(order.points_awarded ?? 0) > 0
      ? [row("Points earned", String(order.points_awarded))]
      : []),
    rule("="),
  ];

  return "```\n" + lines.join("\n") + "\n```";
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
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
  return `${origin}/feedback`;
}

export const FEEDBACK_INVITE =
  "We'd love to hear your feedback! Please leave us a review here:";

/**
 * Appends the friendly feedback invitation + link to any customer WhatsApp message.
 * The URL sits alone on its own line so WhatsApp never swallows a trailing
 * character into the link (which used to send people to a 404).
 */
export function withFeedbackInvite(message: string, link = feedbackLink()) {
  return `${message}\n\n${FEEDBACK_INVITE}\n${link}\n`;
}

/**
 * Builds a click-to-chat link. api.whatsapp.com/send opens the standard
 * WhatsApp app by default; WhatsApp Business only takes over when that number
 * is registered to the Business app on the device.
 */
function chatLink(phone: string, text: string) {
  return `https://api.whatsapp.com/send?phone=${normalisePhone(phone)}&text=${encodeURIComponent(
    text,
  )}&type=phone_number&app_absent=0`;
}

/** Builds a click-to-chat link with the receipt and thank-you message pre-filled. */
export function buildWhatsAppLink(
  phone: string,
  receipt: string,
  thankYouMessage: string,
) {
  return chatLink(phone, withFeedbackInvite(`${receipt}\n\n${thankYouMessage}`));
}

/** Click-to-chat link for a short status / collection update message. */
export function buildWhatsAppMessageLink(phone: string, message: string) {
  return chatLink(phone, withFeedbackInvite(message));
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
