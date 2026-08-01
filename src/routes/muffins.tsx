import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { currency } from "@/lib/format";
import { useMuffins } from "@/lib/queries";
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

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl text-primary">Our muffins</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Small batches, baked fresh each morning. Prices include everything — pay with cash or
          EFT when you collect.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            : (muffins ?? []).map((muffin) => (
                <Card
                  key={muffin.id}
                  className="rounded-2xl transition-transform duration-300 hover:-translate-y-1"
                >
                  <CardContent className="flex h-full flex-col p-6">
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
                    <p className="mt-4 font-display text-xl text-primary">
                      {currency(muffin.price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {!isLoading && (muffins ?? []).length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            No muffins are listed yet — check back soon.
          </p>
        ) : null}

        <div className="mt-10 rounded-3xl surface-cream p-8 text-center">
          <h2 className="font-display text-2xl text-primary">Ready for a fresh batch?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "Head to the order page, pick your muffins and choose how you'd like to pay."
              : "Create a free account to order, track collection and start earning loyalty points."}
          </p>
          <Button asChild size="lg" className="mt-5 rounded-full">
            <Link to={user ? "/admin" : "/auth"} search={user ? { tab: "walk-in" as const } : undefined}>{user ? "Create an order" : "Staff sign in"}</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
