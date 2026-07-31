import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { currency } from "@/lib/format";
import { useMuffins } from "@/lib/queries";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";
import { rewardLabel, discountForReward, type RewardRow } from "@/lib/rewards";

export const Route = createFileRoute("/_authenticated/order")({
  head: () => ({
    meta: [
      { title: "Place an Order — BYLISAM" },
      {
        name: "description",
        content:
          "Pick your muffins, choose cash or EFT, redeem a loyalty reward and place your BYLISAM collection order in a few taps.",
      },
      { property: "og:title", content: "Place an Order — BYLISAM" },
      { property: "og:description", content: "Pick your muffins and place a collection order." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: muffins, isLoading } = useMuffins();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<"cash" | "eft">("cash");
  const [notes, setNotes] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [rewardId, setRewardId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rewards } = useQuery({
    queryKey: ["my-rewards", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []) as unknown as RewardRow[];
    },
  });

  const availableRewards = (rewards ?? []).filter(
    (r) => !r.expires_at || new Date(r.expires_at).getTime() > Date.now(),
  );

  const lines = useMemo(
    () =>
      (muffins ?? [])
        .filter((m) => (cart[m.id] ?? 0) > 0)
        .map((m) => ({ muffin: m, qty: cart[m.id] })),
    [muffins, cart],
  );

  const subtotal = lines.reduce((sum, l) => sum + Number(l.muffin.price) * l.qty, 0);
  const chosenReward = availableRewards.find((r) => r.id === rewardId) ?? null;
  const discount = chosenReward
    ? discountForReward(chosenReward, lines.map((l) => Number(l.muffin.price)))
    : 0;
  const total = Math.max(0, subtotal - discount);

  function setQty(id: string, qty: number, max: number) {
    setCart((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max)) }));
  }

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (lines.length === 0) throw new Error("Add at least one muffin to your order.");
      const trimmedWhatsapp = whatsappValue.trim();
      // Optional field: only validated when the customer actually typed something.
      if (trimmedWhatsapp && !isValidWhatsAppNumber(trimmedWhatsapp)) {
        throw new Error("That WhatsApp number doesn't look right. Leave it blank to skip.");
      }
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user!.id,
          is_walk_in: false,
          customer_name: profile?.full_name || user!.email || "Customer",
          phone: trimmedWhatsapp || profile?.phone || null,
          whatsapp_number: trimmedWhatsapp || null,

          is_student: true,
          payment_method: payment,
          subtotal,
          discount,
          total,
          reward_id: chosenReward?.id ?? null,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          muffin_id: l.muffin.id,
          muffin_name: l.muffin.name,
          unit_price: l.muffin.price,
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;

      if (chosenReward) {
        await supabase
          .from("rewards")
          .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
          .eq("id", chosenReward.id);
      }
      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries();
      toast.success(`Order ${order.reference} placed! We'll approve it shortly. 🧁`);
      navigate({ to: "/orders" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not place order"),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl text-primary">Place an order</h1>
        <p className="mt-2 text-muted-foreground">
          Choose your muffins, pick how you'd like to pay on collection, and we'll do the rest.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
              : (muffins ?? []).map((muffin) => {
                  const qty = cart[muffin.id] ?? 0;
                  const soldOut = muffin.stock <= 0;
                  return (
                    <Card key={muffin.id} className="rounded-2xl">
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {muffin.flavour}
                          </p>
                          <h2 className="font-display text-lg text-primary">{muffin.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {currency(muffin.price)} · {soldOut ? "Sold out" : `${muffin.stock} available`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            disabled={qty === 0}
                            onClick={() => setQty(muffin.id, qty - 1, muffin.stock)}
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Remove one</span>
                          </Button>
                          <span className="w-8 text-center font-semibold">{qty}</span>
                          <Button
                            type="button"
                            size="icon"
                            className="rounded-full"
                            disabled={soldOut || qty >= muffin.stock}
                            onClick={() => setQty(muffin.id, qty + 1, muffin.stock)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add one</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          <Card className="h-fit rounded-3xl lg:sticky lg:top-24">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-display text-xl text-primary">Your order</h2>

              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No muffins selected yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {lines.map((l) => (
                    <li key={l.muffin.id} className="flex justify-between gap-3">
                      <span>
                        {l.qty} × {l.muffin.name}
                      </span>
                      <span>{currency(Number(l.muffin.price) * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {availableRewards.length > 0 ? (
                <div className="space-y-2 rounded-2xl surface-cream p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Gift className="h-4 w-4" /> Use a reward
                  </p>
                  <RadioGroup
                    value={rewardId ?? "none"}
                    onValueChange={(v) => setRewardId(v === "none" ? null : v)}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="none" id="reward-none" />
                      <Label htmlFor="reward-none" className="text-sm font-normal">
                        Not this time
                      </Label>
                    </div>
                    {availableRewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-2">
                        <RadioGroupItem value={reward.id} id={`reward-${reward.id}`} />
                        <Label htmlFor={`reward-${reward.id}`} className="text-sm font-normal">
                          {rewardLabel(reward)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Payment method</Label>
                <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "cash" | "eft")}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cash" id="pay-cash" />
                    <Label htmlFor="pay-cash" className="font-normal">
                      Cash on collection
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="eft" id="pay-eft" />
                    <Label htmlFor="pay-eft" className="font-normal">
                      EFT / bank transfer
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  We only record which method you chose — never any banking details.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note for BYLISAM (optional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Collection time, room number…"
                />
              </div>

              <div className="space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{currency(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Reward discount</span>
                    <span>-{currency(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-display text-lg text-primary">
                  <span>Total</span>
                  <span>{currency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full rounded-full"
                size="lg"
                disabled={lines.length === 0 || placeOrder.isPending}
                onClick={() => placeOrder.mutate()}
              >
                {placeOrder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Place order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
