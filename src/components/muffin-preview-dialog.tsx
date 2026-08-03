import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { MuffinImage } from "@/components/muffin-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currency } from "@/lib/format";
import type { Muffin } from "@/lib/queries";

type Props = {
  muffin: Muffin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Label for the confirm button, e.g. "Order now" or "Add to order". */
  actionLabel?: string;
  initialQty?: number;
  onConfirm: (muffin: Muffin, qty: number) => void;
};

/** Quick-look popup for a muffin: photo, description, price, points and quantity. */
export function MuffinPreviewDialog({
  muffin,
  open,
  onOpenChange,
  actionLabel = "Order now",
  initialQty = 1,
  onConfirm,
}: Props) {
  const [qty, setQty] = useState(initialQty);

  useEffect(() => {
    if (open) setQty(Math.max(1, initialQty));
  }, [open, initialQty, muffin?.id]);

  if (!muffin) return null;

  const soldOut = muffin.stock <= 0;
  const max = Math.max(1, muffin.stock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">{muffin.name}</DialogTitle>
          <DialogDescription className="text-xs font-semibold uppercase tracking-wide">
            {muffin.flavour}
          </DialogDescription>
        </DialogHeader>

        <MuffinImage path={muffin.image_url} alt={muffin.name} className="h-48 w-full" />

        <p className="text-sm text-muted-foreground">{muffin.description}</p>

        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-primary">{currency(muffin.price)}</p>
          <div className="flex items-center gap-2">
            {muffin.points_value > 0 ? (
              <Badge variant="outline" className="rounded-full">
                Earns {muffin.points_value} pt{muffin.points_value === 1 ? "" : "s"}
              </Badge>
            ) : null}
            {soldOut ? (
              <Badge variant="outline" className="rounded-full text-muted-foreground">
                Sold out
              </Badge>
            ) : (
              <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                {muffin.stock} left
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl surface-cream p-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Fewer</span>
            </Button>
            <span className="w-8 text-center font-display text-lg">{qty}</span>
            <Button
              type="button"
              size="icon"
              className="rounded-full"
              disabled={soldOut || qty >= max}
              onClick={() => setQty((q) => Math.min(max, q + 1))}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </div>
        </div>

        <Button
          className="w-full rounded-full"
          size="lg"
          disabled={soldOut}
          onClick={() => onConfirm(muffin, qty)}
        >
          {soldOut ? "Sold out" : actionLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
