import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, Gift, Loader2, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DeliveryNotice } from "@/components/delivery-notice";
import { MuffinImage } from "@/components/muffin-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { applyPointsToCart, useCart } from "@/lib/cart";
import { currency } from "@/lib/format";
import { useAppSettings, useRewardSettings } from "@/lib/queries";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";

/** Cart + checkout in a single popup, opened from the cart icon in the navbar. */
export function CheckoutDialog() {
  const { lines, count, subtotal, checkoutOpen, setCheckoutOpen, setQty, remove, clear } = useCart();
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: settings } = useAppSettings();
  const { data: rewardSettings } = useRewardSettings();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [payment, setPayment] = useState<"cash" | "eft">("cash");
  const [notes, setNotes] = useState("");
  const [residence, setResidence] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  const points = profile?.points ?? 0;
  const threshold = Math.max(1, rewardSettings?.min_redemption_points ?? 10);
  const rewardsActive = rewardSettings?.is_active ?? true;
  const affordableUnits = Math.floor(points / threshold);
  const canRedeem = rewardsActive && affordableUnits > 0 && count > 0;
  const pointsNeeded = Math.max(0, threshold - points);

  const freeUnits = usePoints && canRedeem ? Math.min(affordableUnits, count) : 0;
  const { priced, discount, unitsRedeemed } = applyPointsToCart(lines, freeUnits);
  const pointsSpent = unitsRedeemed * threshold;
  const total = Math.max(0, subtotal - discount);
  const whatsappValue = whatsapp ?? profile?.whatsapp_number ?? profile?.phone ?? "";
  const isOpen = settings?.is_open ?? true;

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to place your order.");
      if (lines.length === 0) throw new Error("Your cart is empty.");
      const trimmedWhatsapp = whatsappValue.trim();
      const trimmedResidence = residence.trim();
      if (trimmedResidence.length < 2) {
        throw new Error("Please tell us which student residence you're in.");
      }
      if (trimmedWhatsapp && !isValidWhatsAppNumber(trimmedWhatsapp)) {
        throw new Error("That WhatsApp number doesn't look right. Leave it blank to skip.");
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          is_walk_in: false,
          customer_name: profile?.full_name || user.email || "Customer",
          phone: trimmedWhatsapp || profile?.phone || null,
          whatsapp_number: trimmedWhatsapp || null,
          residence: trimmedResidence,
          is_student: true,
          payment_method: payment,
          subtotal,
          discount,
          total,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Redeemed muffins are stored as their own R0.00 line so the admin can
      // see exactly what was bought with points versus cash/EFT.
      const items = priced.flatMap((line) => [
        ...(line.freeQty > 0
          ? [
              {
                order_id: order.id,
                muffin_id: line.id,
                muffin_name: `${line.name} (reward)`,
                unit_price: 0,
                quantity: line.freeQty,
              },
            ]
          : []),
        ...(line.paidQty > 0
          ? [
              {
                order_id: order.id,
                muffin_id: line.id,
                muffin_name: line.name,
                unit_price: Number(line.price),
                quantity: line.paidQty,
              },
            ]
          : []),
      ]);
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      // Points come off only once the order has been placed successfully.
      if (pointsSpent > 0) {
        await supabase
          .from("profiles")
          .update({ points: Math.max(0, points - pointsSpent) })
          .eq("id", user.id);
        await supabase.from("reward_transactions").insert({
          user_id: user.id,
          points: -pointsSpent,
          reason: `Redeemed ${unitsRedeemed} muffin${unitsRedeemed === 1 ? "" : "s"} on order ${order.reference}`,
          order_id: order.id,
          created_by: user.id,
        });
      }

      return order;
    },
    onSuccess: (order) => {
      clear();
      setUsePoints(false);
      setNotes("");
      setCheckoutOpen(false);
      queryClient.invalidateQueries();
      toast.success(`Order ${order.reference} placed! We'll approve it shortly. 🧁`);
      navigate({ to: "/orders" });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not place order"),
  });

  return (
    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Your cart</DialogTitle>
          <DialogDescription>
            {count === 0
              ? "Nothing here yet — add a muffin from Our muffins."
              : `${count} muffin${count === 1 ? "" : "s"} ready to go.`}
          </DialogDescription>
        </DialogHeader>

        {!isOpen ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p>
              <span className="font-semibold text-destructive">We're closed right now.</span> You
              can still order — we'll confirm it as soon as we re-open
              {settings?.opening_hours ? ` (${settings.opening_hours})` : ""}.
            </p>
          </div>
        ) : null}

        {lines.length > 0 ? (
          <ul className="space-y-3">
            {priced.map((line) => (
              <li key={line.id} className="flex items-center gap-3">
                <MuffinImage path={line.image_url} alt={line.name} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-primary">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currency(line.price)} each
                    {line.freeQty > 0 ? (
                      <span className="ml-1 font-semibold text-success">
                        · {line.freeQty} free with points
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setQty(line.id, line.qty - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                    <span className="sr-only">Fewer</span>
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={line.qty >= line.stock}
                    onClick={() => setQty(line.id, line.qty + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="sr-only">More</span>
                  </Button>
                </div>
                <span className="w-16 text-right text-sm font-semibold">
                  {currency(line.paidQty * Number(line.price))}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground"
                  onClick={() => remove(line.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove {line.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {lines.length > 0 ? (
          <>
            <div className="space-y-2 rounded-2xl surface-cream p-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="use-points" className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Gift className="h-4 w-4" /> Redeem points
                </Label>
                <Switch
                  id="use-points"
                  checked={usePoints && canRedeem}
                  disabled={!canRedeem}
                  onCheckedChange={setUsePoints}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {canRedeem
                  ? `You have ${points} points — enough for ${affordableUnits} free muffin${affordableUnits === 1 ? "" : "s"} (${threshold} points each).`
                  : `You have ${points} points. Earn ${pointsNeeded} more to claim a free muffin.`}
              </p>
            </div>

            <DeliveryNotice />

            <div className="space-y-2">
              <Label>Payment method</Label>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "cash" | "eft")}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cash" id="co-cash" />
                  <Label htmlFor="co-cash" className="font-normal">Cash on collection</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="eft" id="co-eft" />
                  <Label htmlFor="co-eft" className="font-normal">EFT / bank transfer</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                We only record which method you chose — never any banking details.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="co-residence">Student residence *</Label>
              <Input
                id="co-residence"
                required
                maxLength={80}
                placeholder="e.g. Kovacs Residence"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="co-whatsapp">WhatsApp number (recommended)</Label>
              <Input
                id="co-whatsapp"
                type="tel"
                inputMode="tel"
                maxLength={20}
                autoComplete="tel"
                placeholder="082 123 4567"
                value={whatsappValue}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional — we send your receipt here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="co-notes">Note for us (optional)</Label>
              <Textarea
                id="co-notes"
                rows={2}
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery time, room number…"
              />
            </div>

            <div className="space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Reward discount ({pointsSpent} points)</span>
                  <span>-{currency(discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-display text-lg text-primary">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
            </div>
          </>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {user ? (
            <Button
              className="flex-1 rounded-full"
              size="lg"
              disabled={lines.length === 0 || placeOrder.isPending}
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Place order
            </Button>
          ) : (
            <Button asChild className="flex-1 rounded-full" size="lg">
              <Link to="/auth" onClick={() => setCheckoutOpen(false)}>
                Sign in to order
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full"
            disabled={lines.length === 0}
            onClick={() => {
              clear();
              toast.success("Cart cleared.");
            }}
          >
            Clear cart
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/muffins" onClick={() => setCheckoutOpen(false)}>
              Back to shopping
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
