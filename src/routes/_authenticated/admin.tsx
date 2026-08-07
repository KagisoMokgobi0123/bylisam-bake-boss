import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-shell";
import { OrderReceipt } from "@/components/order-receipt";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile, useSession } from "@/lib/auth";
import { currency, formatDate, type OrderStatus } from "@/lib/format";
import { useAppSettings, useMuffins, useRewardSettings, type Muffin } from "@/lib/queries";
import { buildReceiptText, buildWhatsAppLink, DEFAULT_THANK_YOU } from "@/lib/whatsapp";
import { ProfitCalculator } from "@/components/admin/profit-calculator";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { WalkInPanel } from "@/components/admin/walk-in-panel";
import { UsersManager } from "@/components/admin/users-manager";
import { AdminReports } from "@/components/admin/reports";
import { BusinessSettings } from "@/components/admin/business-settings";
import { MuffinImage } from "@/components/muffin-image";
import { uploadMuffinImage } from "@/lib/muffin-images";
import { costPerUnit, percent, profitMargin, totalIngredientCost } from "@/lib/profit";
import { useProductionCosts, useProductionSettings } from "@/lib/production";

const adminSearchSchema = z.object({
  tab: z
    .enum([
      "overview",
      "orders",
      "walk-in",
      "muffins",
      "reports",
      "profit",
      "reviews",
      "users",
      "settings",
    ])
    .optional(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: adminSearchSchema,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BYLISAM" },
      {
        name: "description",
        content:
          "Manage BYLISAM muffin stock, prices, customer orders and collections from one warm, simple dashboard.",
      },
      { property: "og:title", content: "Admin Dashboard — BYLISAM" },
      { property: "og:description", content: "Manage muffins, orders and collections." },
    ],
  }),
  component: AdminPage,
});

type OrderRow = {
  id: string;
  reference: string;
  customer_id: string | null;
  customer_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  is_walk_in: boolean;
  is_student: boolean;
  payment_method: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  points_awarded: number;
  created_at: string;
  collected_at: string | null;
  cashier_name: string | null;
  amount_paid: number | null;
  order_items: { id: string; muffin_id: string | null; muffin_name: string; quantity: number; unit_price: number }[];
};

function AdminPage() {
  const { user } = useSession();
  const { tab } = Route.useSearch();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);

  if (roleLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-2xl text-primary">Admin only</h1>
          <p className="mt-2 text-muted-foreground">
            This area is reserved for the BYLISAM owner.
          </p>
        </div>
      </PageShell>
    );
  }

  const current = tab ?? "overview";
  const titles: Record<NonNullable<typeof tab>, string> = {
    overview: "Overview",
    orders: "Orders",
    "walk-in": "Walk-ins",
    muffins: "Muffins & prices",
    reports: "Reports",
    profit: "Profit calculator",
    reviews: "Reviews",
    users: "Users",
    settings: "Profile & business settings",
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="font-display text-3xl text-primary">{titles[current]}</h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to run BYLISAM day to day — switch sections from the top menu.
        </p>

        <div className="mt-8">
          {current === "overview" ? <Overview /> : null}
          {current === "orders" ? <OrdersBoard /> : null}
          {current === "walk-in" ? <WalkInPanel /> : null}
          {current === "muffins" ? <MuffinManager /> : null}
          {current === "reports" ? <AdminReports /> : null}
          {current === "profit" ? <ProfitCalculator /> : null}
          {current === "reviews" ? <ReviewsManager /> : null}
          {current === "users" ? <UsersManager /> : null}
          {current === "settings" ? <BusinessSettings /> : null}
        </div>
      </div>
    </PageShell>
  );
}

function useAdminOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
}

function Overview() {
  const { data: orders } = useAdminOrders();
  const { data: muffins } = useMuffins(false);
  const { data: costLines } = useProductionCosts();
  const { data: production } = useProductionSettings();

  const collected = (orders ?? []).filter((o) => o.status === "collected");
  const revenue = collected.reduce((sum, o) => sum + Number(o.total), 0);
  const pending = (orders ?? []).filter((o) => o.status === "pending").length;
  const lowStock = (muffins ?? []).filter((m) => m.stock <= 3 && m.is_active);

  // Cost side comes from the profit calculator: cost per cupcake × cupcakes sold.
  const unitCost = costPerUnit(totalIngredientCost(costLines ?? []), production?.batch_yield ?? 0);
  const unitsSold = collected.reduce(
    (sum, o) => sum + o.order_items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  const totalCost = unitCost * unitsSold;
  const profit = revenue - totalCost;

  const stats = [
    { label: "Sales recorded", value: currency(revenue) },
    { label: "Completed orders", value: String(collected.length) },
    { label: "Waiting for approval", value: String(pending) },
    { label: "Muffin types", value: String((muffins ?? []).length) },
  ];

  const profitStats = [
    { label: "Total revenue", value: currency(revenue) },
    { label: "Total production cost", value: currency(totalCost) },
    { label: "Total profit", value: currency(profit) },
    { label: "Profit margin", value: percent(profitMargin(revenue, profit)) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-2 font-display text-2xl text-primary">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg text-primary">Profit summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on {unitsSold} cupcake{unitsSold === 1 ? "" : "s"} collected at{" "}
          {currency(unitCost)} cost each — update ingredients in the profit calculator.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profitStats.map((stat) => (
            <Card key={stat.label} className="rounded-2xl surface-cream">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl text-primary">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


      {lowStock.length > 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-display text-lg text-primary">Running low</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {lowStock.map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span>{m.name}</span>
                  <span className="text-muted-foreground">{m.stock} left</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function OrdersBoard() {
  const { data: orders, isLoading } = useAdminOrders();
  const { data: settings } = useAppSettings();
  const { data: rewardSettings } = useRewardSettings();
  const { user } = useSession();
  const { data: adminProfile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const cashierName = adminProfile?.full_name || "BYLISAM staff";

  const receiptBusiness = {
    name: settings?.business_name ?? "BYLISAM",
    address: settings?.business_address,
    phone: settings?.business_phone || settings?.whatsapp_number,
    email: settings?.business_email,
    taxRate: settings?.tax_rate,
    cashierName,
  };

  /** One click: complete the order, award points, drop stock and message the customer. */
  const complete = useMutation({
    mutationFn: async (order: OrderRow) => {
      const muffinIds = order.order_items
        .map((i) => i.muffin_id)
        .filter((id): id is string => !!id);
      const { data: muffinRows } = muffinIds.length
        ? await supabase.from("muffins").select("id, points_value").in("id", muffinIds)
        : { data: [] as { id: string; points_value: number }[] };
      const pointsFor = (muffinId: string | null) =>
        muffinId
          ? ((muffinRows ?? []).find((m) => m.id === muffinId)?.points_value ??
            (rewardSettings?.points_per_muffin ?? 0))
          : (rewardSettings?.points_per_muffin ?? 0);

      const earned = order.order_items.reduce(
        (sum, i) => sum + i.quantity * pointsFor(i.muffin_id),
        0,
      );
      const points =
        (rewardSettings?.is_active ?? true) && order.customer_id
          ? earned + (rewardSettings?.points_per_purchase ?? 0)
          : 0;

      const { error } = await supabase
        .from("orders")
        .update({
          status: "collected",
          collected_at: new Date().toISOString(),
          points_awarded: points,
          cashier_name: cashierName,
          amount_paid: Number(order.total),
        })
        .eq("id", order.id);
      if (error) throw error;

      for (const item of order.order_items) {
        if (!item.muffin_id) continue;
        const { data: muffin } = await supabase
          .from("muffins")
          .select("stock")
          .eq("id", item.muffin_id)
          .maybeSingle();
        if (muffin) {
          await supabase
            .from("muffins")
            .update({ stock: Math.max(0, muffin.stock - item.quantity) })
            .eq("id", item.muffin_id);
        }
      }

      if (points > 0 && order.customer_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("id", order.customer_id)
          .maybeSingle();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ points: profile.points + points })
            .eq("id", order.customer_id);
          await supabase.from("reward_transactions").insert({
            user_id: order.customer_id,
            points,
            reason: `Points earned on order ${order.reference}`,
            order_id: order.id,
            created_by: user?.id ?? null,
          });
        }
      }

      return { ...order, points_awarded: points };
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries();
      const contactNumber = order.whatsapp_number || order.phone;
      if (contactNumber) {
        // Automatically hand the completion message + receipt to WhatsApp.
        window.open(
          buildWhatsAppLink(
            contactNumber,
            buildReceiptText(order, order.order_items, receiptBusiness),
            settings?.whatsapp_template || DEFAULT_THANK_YOU,
          ),
          "_blank",
          "noopener",
        );
        toast.success("Order completed — WhatsApp message ready to send.");
      } else {
        toast.success("Order completed.");
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Order cancelled.");
    },
  });

  const receiptOrder = (orders ?? []).find((o) => o.id === receiptId) ?? null;

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      {(orders ?? []).length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : null}

      {(orders ?? []).map((order) => {
        const contactNumber = order.whatsapp_number || order.phone;
        const whatsappUrl =
          contactNumber && order.status === "collected"
            ? buildWhatsAppLink(
                contactNumber,
                buildReceiptText(order, order.order_items, receiptBusiness),
                settings?.whatsapp_template || DEFAULT_THANK_YOU,
              )
            : null;

        return (
          <Card key={order.id} className="rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-primary">
                    {order.reference}
                    {order.is_walk_in ? (
                      <Badge variant="outline" className="ml-2 rounded-full text-xs">
                        Walk-in
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} · {formatDate(order.created_at)}
                  </p>
                  {order.phone ? (
                    <p className="text-sm text-muted-foreground">{order.phone}</p>
                  ) : null}
                </div>
                <StatusBadge status={order.status} />
              </div>

              <ul className="space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {item.quantity} × {item.muffin_name}
                      {Number(item.unit_price) === 0 ? (
                        <Badge className="rounded-full border-accent bg-accent text-accent-foreground">
                          Paid with points
                        </Badge>
                      ) : null}
                    </span>
                    <span>
                      {Number(item.unit_price) === 0
                        ? "Free"
                        : currency(Number(item.unit_price) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>


              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="font-display text-lg text-primary">{currency(order.total)}</p>
                <p className="text-sm uppercase text-muted-foreground">{order.payment_method}</p>
                <div className="flex flex-wrap gap-2">
                  {order.status !== "collected" && order.status !== "cancelled" ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={complete.isPending || advance.isPending}
                      onClick={() =>
                        order.status === "ready"
                          ? complete.mutate(order)
                          : advance.mutate(order)
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />{" "}
                      {NEXT_STATUS_ACTION[order.status] ?? "Order completed"}
                    </Button>
                  ) : null}
                  {order.status === "collected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setReceiptId(order.id)}
                    >
                      <Receipt className="mr-1.5 h-4 w-4" /> Receipt
                    </Button>
                  ) : null}
                  {whatsappUrl ? (
                    <Button asChild size="sm" variant="secondary" className="rounded-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-1.5 h-4 w-4" /> Resend WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  {order.status !== "collected" && order.status !== "cancelled" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive"
                      onClick={() => cancel.mutate(order.id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <OrderReceipt
        open={!!receiptOrder}
        onOpenChange={(open) => !open && setReceiptId(null)}
        order={receiptOrder as never}
        items={receiptOrder?.order_items ?? []}
        footer={settings?.receipt_footer}
        cashierName={receiptOrder?.cashier_name ?? cashierName}
        business={{
          name: settings?.business_name,
          phone: settings?.business_phone || settings?.whatsapp_number,
          email: settings?.business_email,
          address: settings?.business_address,
          taxRate: settings?.tax_rate,
        }}
      />
    </div>
  );
}



const emptyMuffin = {
  name: "",
  flavour: "",
  description: "",
  price: "0",
  stock: "0",
  points_value: "1",
  image_url: "" as string,
  is_active: true,
};

function MuffinManager() {
  const { data: muffins, isLoading } = useMuffins(false);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Muffin | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyMuffin });
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      const path = await uploadMuffinImage(file);
      setForm((prev) => ({ ...prev, image_url: path }));
      toast.success("Photo uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyMuffin });
    setOpen(true);
  }

  function openEdit(muffin: Muffin) {
    setEditing(muffin);
    setForm({
      name: muffin.name,
      flavour: muffin.flavour,
      description: muffin.description,
      price: String(muffin.price),
      stock: String(muffin.stock),
      points_value: String(muffin.points_value ?? 1),
      image_url: muffin.image_url ?? "",
      is_active: muffin.is_active,
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Give the muffin a name.");
      const payload = {
        name: form.name.trim(),
        flavour: form.flavour.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        stock: Math.max(0, Math.round(Number(form.stock) || 0)),
        points_value: Math.max(0, Math.round(Number(form.points_value) || 0)),
        image_url: form.image_url || null,
        is_active: form.is_active,
      };
      const { error } = editing
        ? await supabase.from("muffins").update(payload).eq("id", editing.id)
        : await supabase.from("muffins").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muffins"] });
      toast.success(editing ? "Muffin updated." : "Muffin added.");
      setOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("muffins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muffins"] });
      toast.success("Muffin removed.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" /> Add muffin
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-primary">
                {editing ? "Edit muffin" : "New muffin"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="m-name">Name</Label>
                <Input
                  id="m-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-flavour">Flavour</Label>
                <Input
                  id="m-flavour"
                  value={form.flavour}
                  onChange={(e) => setForm({ ...form, flavour: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-desc">Description</Label>
                <Textarea
                  id="m-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="m-price">Price (R)</Label>
                  <Input
                    id="m-price"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-stock">Stock</Label>
                  <Input
                    id="m-stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-points">Reward points earned per muffin</Label>
                <Input
                  id="m-points"
                  type="number"
                  min="0"
                  value={form.points_value}
                  onChange={(e) => setForm({ ...form, points_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-image">Photo</Label>
                <div className="flex items-center gap-3">
                  <MuffinImage path={form.image_url} alt="" className="h-16 w-16 shrink-0" />
                  <Input
                    id="m-image"
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(file);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Photos show on the customer muffin menu.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl surface-cream px-4 py-3">
                <Label htmlFor="m-active">Available to order</Label>
                <Switch
                  id="m-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
              <Button
                className="w-full rounded-full"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save muffin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(muffins ?? []).map((muffin) => (
            <Card key={muffin.id} className="rounded-2xl">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <MuffinImage path={muffin.image_url} alt={muffin.name} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {muffin.flavour}
                  </p>
                  <h3 className="font-display text-lg text-primary">{muffin.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currency(muffin.price)} · {muffin.stock} in stock ·{" "}
                    {muffin.points_value ?? 0} pts · {muffin.is_active ? "Available" : "Hidden"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="rounded-full" onClick={() => openEdit(muffin)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove.mutate(muffin.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
