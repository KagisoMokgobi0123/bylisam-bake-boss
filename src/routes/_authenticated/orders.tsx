import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Receipt } from "lucide-react";

import { PageShell } from "@/components/site-shell";
import { OrderReceipt } from "@/components/order-receipt";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { currency, formatDate, STATUS_LABELS, type OrderStatus } from "@/lib/format";
import { useAppSettings } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders & Collection Status — BYLISAM" },
      {
        name: "description",
        content:
          "Track your BYLISAM muffin orders from pending to approved, ready for collection and collected, and view past receipts.",
      },
      { property: "og:title", content: "My Orders & Collection Status — BYLISAM" },
      { property: "og:description", content: "Track your BYLISAM orders and view past receipts." },
    ],
  }),
  component: OrdersPage,
});

const STEPS: OrderStatus[] = ["pending", "approved", "ready", "collected"];

function OrdersPage() {
  const { user } = useSession();
  const { data: settings } = useAppSettings();
  const [receiptId, setReceiptId] = useState<string | null>(null);
  useOrdersRealtime(["my-orders", "my-order-updates"]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const receiptOrder = (orders ?? []).find((o) => o.id === receiptId) ?? null;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl text-primary">My orders</h1>
        <p className="mt-2 text-muted-foreground">
          Follow each order from pending through to collection.
        </p>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          ) : (orders ?? []).length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="p-10 text-center">
                <p className="text-muted-foreground">You haven't placed an order yet.</p>
                <Button asChild className="mt-5 rounded-full">
                  <Link to="/muffins">Order some muffins</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            (orders ?? []).map((order) => {
              const status = order.status as OrderStatus;
              const stepIndex = STEPS.indexOf(status);
              return (
                <Card key={order.id} className="rounded-3xl">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-lg text-primary">{order.reference}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <ul className="space-y-1 text-sm">
                      {order.order_items.map((item: { id: string; quantity: number; muffin_name: string; unit_price: number }) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>
                            {item.quantity} × {item.muffin_name}
                          </span>
                          <span>{currency(Number(item.unit_price) * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="font-display text-lg text-primary">{currency(order.total)}</p>
                      <p className="text-sm uppercase text-muted-foreground">
                        {order.payment_method}
                      </p>
                      {status === "collected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setReceiptId(order.id)}
                        >
                          <Receipt className="mr-1.5 h-4 w-4" /> Receipt
                        </Button>
                      ) : null}
                    </div>

                    {status !== "cancelled" ? (
                      <div className="flex gap-1.5">
                        {STEPS.map((step, index) => (
                          <div key={step} className="flex-1">
                            <div
                              className={`h-1.5 rounded-full transition-colors ${
                                index <= stepIndex ? "bg-primary" : "bg-border"
                              }`}
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              {STATUS_LABELS[step]}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <OrderReceipt
        open={!!receiptOrder}
        onOpenChange={(open) => !open && setReceiptId(null)}
        order={receiptOrder as never}
        items={receiptOrder?.order_items ?? []}
        footer={settings?.receipt_footer}
        business={{
          name: settings?.business_name,
          phone: settings?.business_phone || settings?.whatsapp_number,
          email: settings?.business_email,
          address: settings?.business_address,
          taxRate: settings?.tax_rate,
        }}
      />
    </PageShell>
  );
}
