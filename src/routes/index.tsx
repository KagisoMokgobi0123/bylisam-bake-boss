import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Gift, Quote, Wallet } from "lucide-react";

import heroImage from "@/assets/hero-muffins.jpg";
import { PageShell } from "@/components/site-shell";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { currency, formatDay } from "@/lib/format";
import { useMuffins } from "@/lib/queries";
import { useApprovedReviews } from "@/lib/reviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BYLISAM — Homemade Muffins in Residence" },
      {
        name: "description",
        content:
          "Order freshly baked homemade muffins from BYLISAM, collect on campus and earn loyalty rewards. Student-friendly prices, no card details needed.",
      },
      { property: "og:title", content: "BYLISAM — Homemade Muffins in Residence" },
      {
        property: "og:description",
        content:
          "Order freshly baked homemade muffins, collect on campus and earn loyalty rewards.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: muffins } = useMuffins();
  const { data: reviews } = useApprovedReviews(6);
  const featured = (muffins ?? []).slice(0, 3);
  const published = reviews ?? [];
  const averageRating =
    published.length > 0
      ? published.reduce((sum, r) => sum + r.rating, 0) / published.length
      : 0;

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="mb-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            Baked fresh in residence
          </p>
          <h1 className="font-display text-4xl leading-tight text-primary md:text-5xl">
            Warm, homemade muffins — a few steps from your room.
          </h1>
          <p className="mt-4 max-w-prose text-base text-muted-foreground">
            BYLISAM bakes small batches every day for students who want something fresh,
            affordable and made with care. Order online, collect in person, and earn rewards
            every time you treat yourself.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/muffins">
                See today's muffins <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/auth" search={{ mode: "register" }}>
                Create an account
              </Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl shadow-warm">
          <img
            src={heroImage}
            alt="Freshly baked BYLISAM muffins on a wooden board"
            width={1600}
            height={1100}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="surface-cream border-y border-border py-12">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "No payment details",
              body: "Choose cash or EFT and settle in person. We never store card or banking information.",
            },
            {
              icon: Gift,
              title: "Loyalty rewards",
              body: "Earn points on every muffin and redeem them for a free treat or a discount.",
            },
            {
              icon: BadgeCheck,
              title: "Track every order",
              body: "Watch your order move from pending to approved to ready for collection.",
            },
          ].map((item) => (
            <Card key={item.title} className="rounded-2xl border-border/70 bg-background shadow-soft">
              <CardContent className="p-6">
                <item.icon className="h-7 w-7 text-primary" aria-hidden />
                <h2 className="mt-4 font-display text-lg text-primary">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl text-primary">Fresh from the oven</h2>
            <Link to="/muffins" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((muffin) => (
              <Card key={muffin.id} className="rounded-2xl transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {muffin.flavour}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-primary">{muffin.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {muffin.description}
                  </p>
                  <p className="mt-4 font-display text-xl text-primary">{currency(muffin.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
