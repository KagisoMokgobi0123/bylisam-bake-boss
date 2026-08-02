import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Loader2, Minus, Plus, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { currency, formatDate, formatDay } from "@/lib/format";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  orderCount: number;
  spend: number;
};

type SortKey = "full_name" | "email" | "orderCount" | "points" | "created_at";

function useCustomers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: orders, error: orderError }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("customer_id, total, status"),
      ]);
      if (error) throw error;
      if (orderError) throw orderError;

      return (profiles ?? []).map((profile) => {
        const mine = (orders ?? []).filter((o) => o.customer_id === profile.id);
        return {
          ...profile,
          orderCount: mine.length,
          spend: mine
            .filter((o) => o.status === "collected")
            .reduce((sum, o) => sum + Number(o.total), 0),
        } as UserRow;
      });
    },
  });
}

function useRewardHistory(userId: string | null) {
  return useQuery({
    queryKey: ["reward-transactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function UsersManager() {
  const { data: users, isLoading } = useCustomers();
  const { user: admin } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "created_at",
    dir: "desc",
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pointsDelta, setPointsDelta] = useState("0");
  const [reason, setReason] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (users ?? []).filter((u) =>
      !term
        ? true
        : [u.full_name, u.email, u.phone ?? "", u.whatsapp_number ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(term),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [users, search, sort]);

  const selected = rows.find((u) => u.id === detailId) ?? null;
  const { data: history } = useRewardHistory(detailId);

  const toggleActive = useMutation({
    mutationFn: async (row: UserRow) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !row.is_active })
        .eq("id", row.id);
      if (error) throw error;
      return !row.is_active;
    },
    onSuccess: (active) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(active ? "Account enabled." : "Account disabled.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  const adjustPoints = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const delta = Math.round(Number(pointsDelta) || 0);
      if (delta === 0) throw new Error("Enter the points to add or deduct.");
      if (reason.trim().length < 3) throw new Error("Please give a reason for this adjustment.");
      const next = Math.max(0, selected.points + delta);

      const { error } = await supabase.from("profiles").update({ points: next }).eq("id", selected.id);
      if (error) throw error;

      const { error: logError } = await supabase.from("reward_transactions").insert({
        user_id: selected.id,
        points: delta,
        reason: reason.trim(),
        created_by: admin?.id ?? null,
      });
      if (logError) throw logError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["reward-transactions"] });
      setPointsDelta("0");
      setReason("");
      toast.success("Reward points updated.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  function sortBy(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "full_name", label: "Customer" },
    { key: "email", label: "Email" },
    { key: "orderCount", label: "Orders" },
    { key: "points", label: "Points" },
    { key: "created_at", label: "Registered" },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="p-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary"
                        onClick={() => sortBy(col.key)}
                      >
                        {col.label}
                        <ArrowUpDown className="h-3 w-3" aria-hidden />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-primary">
                      {row.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3">{row.orderCount}</td>
                    <td className="px-4 py-3">{row.points}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDay(row.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.phone || row.whatsapp_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.is_active ? (
                        <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-destructive">
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setDetailId(row.id)}
                        >
                          View / edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => toggleActive.mutate(row)}
                        >
                          {row.is_active ? (
                            <>
                              <ShieldOff className="mr-1.5 h-4 w-4" /> Disable
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-1.5 h-4 w-4" /> Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              {selected?.full_name || selected?.email}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">Email</p>
                <p>{selected.email}</p>
                <p className="text-muted-foreground">Phone</p>
                <p>{selected.phone || selected.whatsapp_number || "—"}</p>
                <p className="text-muted-foreground">Total orders</p>
                <p>{selected.orderCount}</p>
                <p className="text-muted-foreground">Collected spend</p>
                <p>{currency(selected.spend)}</p>
                <p className="text-muted-foreground">Reward points</p>
                <p className="font-display text-base text-primary">{selected.points}</p>
                <p className="text-muted-foreground">Registered</p>
                <p>{formatDate(selected.created_at)}</p>
              </div>

              <div className="space-y-3 rounded-2xl surface-cream p-4">
                <h3 className="font-display text-base text-primary">Adjust reward points</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="points-delta">Points (+ add / − deduct)</Label>
                    <Input
                      id="points-delta"
                      type="number"
                      value={pointsDelta}
                      onChange={(e) => setPointsDelta(e.target.value)}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setPointsDelta(String((Number(pointsDelta) || 0) - 1))}
                    aria-label="Deduct one point"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setPointsDelta(String((Number(pointsDelta) || 0) + 1))}
                    aria-label="Add one point"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="points-reason">Reason</Label>
                  <Textarea
                    id="points-reason"
                    rows={2}
                    placeholder="Goodwill gesture, correction, promotion…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={adjustPoints.isPending}
                  onClick={() => adjustPoints.mutate()}
                >
                  {adjustPoints.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save adjustment
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-base text-primary">Points history</h3>
                {(history ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No adjustments recorded yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {(history ?? []).map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{entry.reason || "Adjustment"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                        <span
                          className={
                            entry.points >= 0
                              ? "font-display text-success"
                              : "font-display text-destructive"
                          }
                        >
                          {entry.points >= 0 ? "+" : ""}
                          {entry.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
