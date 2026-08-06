import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-shell";
import { DeliveryNotice } from "@/components/delivery-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MuffinImage } from "@/components/muffin-image";
import { MuffinPreviewDialog } from "@/components/muffin-preview-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { currency } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useMuffins, type Muffin } from "@/lib/queries";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/muffins")({
  head: () => ({
    meta: [
      { title: "Our Muffins & Prices — BYLISAM" },
      {
        name: "description",
        content:
          "Browse every BYLISAM muffin flavour with student-friendly prices and see what is freshly baked and in stock today.",
      },
      { property: "og:title", content: "Our Muffins & Prices — BYLISAM" },
      {
        property: "og:description",
        content: "Browse every BYLISAM muffin flavour with student-friendly prices.",
      },
    ],
  }),
  component: MuffinsPage,
});

function MuffinsPage() {
  const { data: muffins, isLoading } = useMuffins();
  const { user } = useSession();
  const { add, setCheckoutOpen } = useCart();
  const [selected, setSelected] = useState<Muffin | null>(null);

  function addToCart(muffin: Muffin, qty: number) {
    add(
      {
        id: muffin.id,
        name: muffin.name,
        price: Number(muffin.price),
        stock: muffin.stock,
        image_url: muffin.image_url,
      },
      qty,
    );
    setSelected(null);
    toast.success(`${qty} × ${muffin.name} added to your cart.`);
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl text-primary">Our muffins</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Small batches, baked fresh each morning. Tap any muffin for a closer look, add it to your
          cart and check out from the cart icon at the top.
        </p>

        <div className="mt-6 max-w-xl">
          <DeliveryNotice />
        </div>


        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            : (muffins ?? []).map((muffin) => (
                <Card
                  key={muffin.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(muffin)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(muffin);
                    }
                  }}
                  className="cursor-pointer rounded-2xl transition-transform duration-300 hover:-translate-y-1"
                >

                  <CardContent className="flex h-full flex-col p-6">
                    <MuffinImage
                      path={muffin.image_url}
                      alt={muffin.name}
                      className="mb-4 h-40 w-full"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {muffin.flavour}
                        </p>
                        <h2 className="mt-1 font-display text-lg text-primary">{muffin.name}</h2>
                      </div>
                      {muffin.stock > 0 ? (
                        <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                          {muffin.stock} left
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-muted-foreground">
                          Sold out
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{muffin.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="font-display text-xl text-primary">{currency(muffin.price)}</p>
                      {muffin.points_value > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Earns {muffin.points_value} pt{muffin.points_value === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <MuffinPreviewDialog
          muffin={selected}
          open={!!selected}
          onOpenChange={(next) => !next && setSelected(null)}
          actionLabel="Add to cart"
          onConfirm={addToCart}
        />

        {!isLoading && (muffins ?? []).length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            No muffins are listed yet — check back soon.
          </p>
        ) : null}

        <div className="mt-10 rounded-3xl surface-cream p-8 text-center">
          <h2 className="font-display text-2xl text-primary">Ready for a fresh batch?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "Add your muffins to the cart, then check out from the cart icon in the top bar."
              : "Create a free account to order, track collection and start earning loyalty points."}
          </p>
          {user ? (
            <Button size="lg" className="mt-5 rounded-full" onClick={() => setCheckoutOpen(true)}>
              Go to cart
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-5 rounded-full">
              <Link to="/auth">Create an account</Link>
            </Button>
          )}

        </div>
      </div>
    </PageShell>
  );
}
