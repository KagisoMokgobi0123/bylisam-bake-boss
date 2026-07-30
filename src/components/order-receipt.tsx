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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ReceiptOrder | null;
  items: ReceiptItem[];
  footer?: string;
  businessName?: string;
};

export function OrderReceipt({
  open,
  onOpenChange,
  order,
  items,
  footer = "Freshly baked with love. 🧁",
  businessName = "BYLISAM",
}: Props) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            {businessName} receipt
          </DialogTitle>
        </DialogHeader>
        <div id="receipt-print-area" className="space-y-3 text-sm">
          <div className="rounded-2xl surface-cream p-4">
            <p className="font-semibold text-primary">Order {order.reference}</p>
            <p className="text-muted-foreground">{formatDate(order.collected_at ?? order.created_at)}</p>
            <p className="text-muted-foreground">{order.customer_name}</p>
            {order.phone ? <p className="text-muted-foreground">{order.phone}</p> : null}
          </div>

          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {item.muffin_name}
                </span>
                <span>{currency(Number(item.unit_price) * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 ? (
              <div className="flex justify-between text-success">
                <span>Reward discount</span>
                <span>-{currency(order.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-display text-lg text-primary">
              <span>Total</span>
              <span>{currency(order.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Payment method</span>
              <span className="uppercase">{order.payment_method}</span>
            </div>
          </div>

          <p className="pt-2 text-center text-xs text-muted-foreground">{footer}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
