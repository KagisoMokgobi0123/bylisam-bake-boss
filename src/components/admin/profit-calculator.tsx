import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/format";
import { costPerUnit, lineTotal, percent, profitMargin, totalIngredientCost } from "@/lib/profit";
import { useProductionCosts, useProductionSettings } from "@/lib/production";

export function ProfitCalculator() {
  const { data: costs, isLoading } = useProductionCosts();
  const { data: settings } = useProductionSettings();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");

  const [batchYield, setBatchYield] = useState("12");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [orderQty, setOrderQty] = useState("12");

  useEffect(() => {
    if (!settings) return;
    setBatchYield(String(settings.batch_yield));
    setSellingPrice(String(settings.selling_price));
  }, [settings]);

  const lines = costs ?? [];
  const ingredientCost = totalIngredientCost(lines);
  const yieldCount = Math.max(0, Math.round(Number(batchYield) || 0));
  const unitCostValue = costPerUnit(ingredientCost, yieldCount);
  const orderCount = Math.max(0, Math.round(Number(orderQty) || 0));
  const orderCost = unitCostValue * orderCount;
  const price = Number(sellingPrice) || 0;
  const orderRevenue = price * orderCount;
  const orderProfit = orderRevenue - orderCost;

  const add = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("Give the ingredient a name.");
      const { error } = await supabase.from("production_costs").insert({
        name: name.trim(),
        quantity: Number(quantity) || 0,
        unit_cost: Number(unitCost) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-costs"] });
      setName("");
      setQuantity("1");
      setUnitCost("0");
      toast.success("Ingredient added.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const update = useMutation({
    mutationFn: async (payload: { id: string; quantity?: number; unit_cost?: number; name?: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("production_costs").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-costs"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-costs"] });
      toast.success("Ingredient removed.");
    },
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("production_settings")
        .upsert({ id: true, batch_yield: yieldCount, selling_price: price });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-settings"] });
      toast.success("Production settings saved.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const summary = [
    { label: "Total ingredient cost", value: currency(ingredientCost) },
    { label: "Total production cost", value: currency(ingredientCost) },
    { label: "Cost per cupcake", value: currency(unitCostValue) },
    { label: `Production cost for ${orderCount}`, value: currency(orderCost) },
    { label: "Selling price each", value: currency(price) },
    { label: `Revenue for ${orderCount}`, value: currency(orderRevenue) },
    { label: "Total profit", value: currency(orderProfit) },
    { label: "Profit margin", value: percent(profitMargin(orderRevenue, orderProfit)) },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg text-primary">Production costs</h2>

          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add your ingredients — flour, sugar, eggs, butter, frosting, packaging and anything
              else you buy for a batch.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden gap-3 px-1 text-xs uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_100px_120px_110px_44px]">
                <span>Ingredient</span>
                <span>Qty</span>
                <span>Unit cost (R)</span>
                <span>Total</span>
                <span className="sr-only">Actions</span>
              </div>
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-2xl surface-cream p-3 sm:grid-cols-[1fr_100px_120px_110px_44px] sm:items-center"
                >
                  <Input
                    aria-label="Ingredient name"
                    defaultValue={line.name}
                    onBlur={(e) =>
                      e.target.value.trim() !== line.name &&
                      update.mutate({ id: line.id, name: e.target.value.trim() })
                    }
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={line.quantity}
                    onChange={(e) =>
                      update.mutate({ id: line.id, quantity: Number(e.target.value) || 0 })
                    }
                  />
                  <Input
                    aria-label="Unit cost"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={line.unit_cost}
                    onChange={(e) =>
                      update.mutate({ id: line.id, unit_cost: Number(e.target.value) || 0 })
                    }
                  />
                  <p className="font-display text-base text-primary">{currency(lineTotal(line))}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove.mutate(line.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {line.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form
            className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_100px_120px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="pc-name">Ingredient / product</Label>
              <Input
                id="pc-name"
                placeholder="Flour"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-qty">Quantity</Label>
              <Input
                id="pc-qty"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-cost">Unit cost (R)</Label>
              <Input
                id="pc-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-full" disabled={add.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg text-primary">Batch &amp; pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pc-yield">Cupcakes per batch</Label>
              <Input
                id="pc-yield"
                type="number"
                min="1"
                value={batchYield}
                onChange={(e) => setBatchYield(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-price">Selling price each (R)</Label>
              <Input
                id="pc-price"
                type="number"
                min="0"
                step="0.5"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-order">Order quantity</Label>
              <Input
                id="pc-order"
                type="number"
                min="0"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={saveSettings.isPending}
            onClick={() => saveSettings.mutate()}
          >
            {saveSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save batch settings
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-display text-xl text-primary">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
