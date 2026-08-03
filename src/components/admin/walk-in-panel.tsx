import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/format";
import { useMuffins } from "@/lib/queries";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";

export function WalkInPanel() {
  const { data: muffins, isLoading } = useMuffins();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [residence, setResidence] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [payment, setPayment] = useState<"cash" | "eft">("cash");

  const available = muffins ?? [];
  const lines = available
    .map((m) => ({ muffin: m, qty: cart[m.id] ?? 0 }))
    .filter((l) => l.qty > 0);
  const total = lines.reduce((sum, l) => sum + Number(l.muffin.price) * l.qty, 0);

  function setQty(id: string, qty: number, max: number) {
    setCart((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max)) }));
  }


  const create = useMutation({
    mutationFn: async () => {
      if (lines.length === 0) throw new Error("Add at least one muffin.");
      const trimmed = whatsapp.trim();
      // Optional field — validated only when the admin captured a number.
      if (trimmed && !isValidWhatsAppNumber(trimmed)) {
        throw new Error("That WhatsApp number doesn't look right. Leave it blank to skip.");
      }
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: null,
          is_walk_in: true,
          customer_name: name.trim() || "Walk-in customer",
          phone: trimmed || null,
          whatsapp_number: trimmed || null,
          is_student: isStudent,
          payment_method: payment,
          subtotal: total,
          discount: 0,
          total,
        })
        .select("id, reference")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          muffin_id: l.muffin.id,
          muffin_name: l.muffin.name,
          unit_price: Number(l.muffin.price),
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;
      return order.reference;
    },
    onSuccess: (reference) => {
      queryClient.invalidateQueries();
      setCart({});
      setName("");
      setWhatsapp("");
      toast.success(`Walk-in order ${reference} created.`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create"),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="rounded-2xl">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-display text-lg text-primary">Pick the muffins</h2>
          {available.map((muffin) => {
            const qty = cart[muffin.id] ?? 0;
            return (
              <div
                key={muffin.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl surface-cream p-3"
              >
                <div>
                  <p className="font-display text-base text-primary">{muffin.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currency(muffin.price)} · {muffin.stock} in stock
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setQty(muffin.id, qty - 1, muffin.stock)}
                  >
                    <Minus className="h-4 w-4" />
                    <span className="sr-only">Fewer {muffin.name}</span>
                  </Button>
                  <span className="w-6 text-center font-display">{qty}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setQty(muffin.id, qty + 1, muffin.stock)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">More {muffin.name}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg text-primary">Customer details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="wi-name">Customer name</Label>
            <Input
              id="wi-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Walk-in customer"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-whatsapp">
              WhatsApp number (recommended — send the receipt straight to them)
            </Label>
            <Input
              id="wi-whatsapp"
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="082 123 4567"
            />
            <p className="text-xs text-muted-foreground">
              Optional — the order can be created without it.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-2xl surface-cream p-3">
            <Label htmlFor="wi-student">Student</Label>
            <Switch id="wi-student" checked={isStudent} onCheckedChange={setIsStudent} />
          </div>
          <div className="flex gap-2">
            {(["cash", "eft"] as const).map((method) => (
              <Button
                key={method}
                type="button"
                variant={payment === method ? "default" : "outline"}
                className="flex-1 rounded-full"
                onClick={() => setPayment(method)}
              >
                {method.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-xl text-primary">{currency(total)}</span>
          </div>
          <Button
            className="w-full rounded-full"
            disabled={create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create walk-in order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
