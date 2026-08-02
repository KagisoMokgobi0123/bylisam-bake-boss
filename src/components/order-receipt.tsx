import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currency, formatDate } from "@/lib/format";
import type { ReceiptItem, ReceiptOrder } from "@/lib/whatsapp";

export type ReceiptBusiness = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxRate?: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ReceiptOrder | null;
  items: ReceiptItem[];
  footer?: string;
  business?: ReceiptBusiness;
  cashierName?: string;
};

const Divider = ({ double }: { double?: boolean }) => (
  <div
    aria-hidden
    className={`border-t ${double ? "border-double border-t-[3px]" : "border-dashed"} border-muted-foreground/50`}
  />
);

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function OrderReceipt({
  open,
  onOpenChange,
  order,
  items,
  footer = "Thank you for your purchase!",
  business,
  cashierName,
}: Props) {
  if (!order) return null;

  const businessName = business?.name ?? "BYLISAM";
  const taxRate = Number(business?.taxRate ?? 0);
  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const total = Number(order.total);
  const tax = taxRate > 0 ? total - total / (1 + taxRate / 100) : 0;
  const paid = order.amount_paid != null ? Number(order.amount_paid) : total;
  const change = Math.max(0, paid - total);
  const points = Number(order.points_awarded ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{businessName} receipt {order.reference}</DialogTitle>
        </DialogHeader>

        <div
          id="receipt-print-area"
          className="space-y-2 rounded-2xl bg-card p-4 font-mono text-[13px] leading-relaxed text-foreground print:w-[76mm] print:rounded-none print:p-0 print:text-[11px]"
        >
          <div className="text-center">
            <p className="font-display text-2xl font-bold uppercase tracking-widest text-primary">
              {businessName}
            </p>
            {business?.address ? <p className="text-xs">{business.address}</p> : null}
            {business?.phone ? <p className="text-xs">Tel: {business.phone}</p> : null}
            {business?.email ? <p className="text-xs">{business.email}</p> : null}
          </div>

          <Divider double />

          <div className="space-y-0.5 text-xs">
            <Line label="Receipt no." value={order.reference} />
            <Line label="Date" value={formatDate(order.collected_at ?? order.created_at)} />
            <Line label="Cashier" value={cashierName || order.cashier_name || "BYLISAM staff"} />
            {order.customer_name ? <Line label="Customer" value={order.customer_name} /> : null}
            {order.phone ? <Line label="Contact" value={order.phone} /> : null}
          </div>

          <Divider />

          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 gap-y-1">
            {items.map((item, index) => (
              <div key={index} className="contents">
                <span className="truncate">{item.muffin_name}</span>
                <span className="text-right">{item.quantity}</span>
                <span className="text-right">{currency(item.unit_price)}</span>
                <span className="text-right">
                  {currency(Number(item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          <div className="space-y-0.5">
            <Line label="Subtotal" value={currency(subtotal)} />
            {discount > 0 ? <Line label="Discount" value={`-${currency(discount)}`} /> : null}
            {taxRate > 0 ? (
              <Line label={`VAT (${taxRate}% incl.)`} value={currency(tax)} />
            ) : null}
          </div>

          <Divider />

          <div className="text-base">
            <Line label="TOTAL" value={currency(total)} bold />
          </div>

          <Divider />

          <div className="space-y-0.5">
            <Line label="Payment method" value={String(order.payment_method).toUpperCase()} />
            <Line label="Amount received" value={currency(paid)} />
            <Line label="Change" value={currency(change)} />
            {points > 0 ? <Line label="Reward points earned" value={String(points)} /> : null}
          </div>

          <Divider double />

          <div className="space-y-1 pt-1 text-center text-xs">
            <p className="font-bold uppercase tracking-widest">Thank you!</p>
            <p className="text-muted-foreground">{footer}</p>
            <p className="text-muted-foreground">No card details are ever stored.</p>
          </div>
        </div>

        <Button variant="outline" className="rounded-full print:hidden" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
