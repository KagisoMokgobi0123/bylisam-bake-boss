import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { currency, formatDate } from "@/lib/format";

type ReportOrder = {
  id: string;
  reference: string;
  customer_name: string;
  residence: string | null;
  total: number;
  status: string;
  created_at: string;
  order_items: { muffin_name: string; quantity: number; unit_price: number }[];
};

function isoStart(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}
function isoEnd(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

export function AdminReports() {
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, reference, customer_name, residence, total, status, created_at, order_items(muffin_name, quantity, unit_price)",
        )
        .gte("created_at", isoStart(from))
        .lte("created_at", isoEnd(to))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportOrder[];
    },
  });

  const orders = useMemo(() => data ?? [], [data]);

  const perCustomer = useMemo(() => {
    const map = new Map<string, { name: string; muffins: number; orders: number; spend: number }>();
    for (const order of orders) {
      const key = order.customer_name || "Walk-in customer";
      const row = map.get(key) ?? { name: key, muffins: 0, orders: 0, spend: 0 };
      row.orders += 1;
      row.spend += Number(order.total);
      row.muffins += order.order_items.reduce((sum, i) => sum + i.quantity, 0);
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.muffins - a.muffins);
  }, [orders]);

  const perResidence = useMemo(() => {
    const map = new Map<string, { name: string; muffins: number; orders: number; spend: number }>();
    for (const order of orders) {
      const key = order.residence?.trim() || "Not captured";
      const row = map.get(key) ?? { name: key, muffins: 0, orders: 0, spend: 0 };
      row.orders += 1;
      row.spend += Number(order.total);
      row.muffins += order.order_items.reduce((sum, i) => sum + i.quantity, 0);
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.muffins - a.muffins);
  }, [orders]);

  const totalMuffins = perCustomer.reduce((sum, r) => sum + r.muffins, 0);
  const totalSpend = perCustomer.reduce((sum, r) => sum + r.spend, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl print:hidden">
        <CardContent className="flex flex-wrap items-end gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="rep-from">From</Label>
            <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-to">To</Label>
            <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button className="rounded-full" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print report
          </Button>
        </CardContent>
      </Card>

      <div id="receipt-print-area" className="space-y-6">
        <div className="hidden print:block">
          <h2 className="font-display text-xl">BYLISAM sales report</h2>
          <p className="text-sm">
            {formatDate(isoStart(from))} — {formatDate(isoEnd(to))}
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-display text-lg text-primary">Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `${orders.length} orders · ${totalMuffins} muffins · ${currency(totalSpend)} in sales`}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-display text-lg text-primary">Muffins ordered per customer</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Customer</th>
                  <th className="pb-2 text-right">Orders</th>
                  <th className="pb-2 text-right">Muffins</th>
                  <th className="pb-2 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {perCustomer.map((row) => (
                  <tr key={row.name} className="border-t border-border/60">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right">{row.orders}</td>
                    <td className="py-2 text-right">{row.muffins}</td>
                    <td className="py-2 text-right">{currency(row.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {perCustomer.length === 0 && !isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">No orders in this period.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-display text-lg text-primary">Which residence buys the most</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Residence</th>
                  <th className="pb-2 text-right">Orders</th>
                  <th className="pb-2 text-right">Muffins</th>
                  <th className="pb-2 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {perResidence.map((row) => (
                  <tr key={row.name} className="border-t border-border/60">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right">{row.orders}</td>
                    <td className="py-2 text-right">{row.muffins}</td>
                    <td className="py-2 text-right">{currency(row.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {perResidence.length === 0 && !isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">No orders in this period.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
