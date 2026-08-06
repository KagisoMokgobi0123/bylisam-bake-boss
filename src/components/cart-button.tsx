import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

/** Cart icon in the navbar; the badge shows how many muffins are selected. */
export function CartButton() {
  const { count, setCheckoutOpen } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setCheckoutOpen(true)}
      className="relative rounded-full text-primary-foreground hover:bg-primary-foreground/10"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
          {count}
        </span>
      ) : null}
      <span className="sr-only">Open cart ({count} items)</span>
    </Button>
  );
}
