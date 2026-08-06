import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = "bylisam-orders-seen-at";

/** Bell in the admin navbar showing how many orders have arrived since the last look. */
export function AdminOrderBell() {
  const navigate = useNavigate();
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSeenAt(window.localStorage.getItem(SEEN_KEY));
    setHydrated(true);
  }, []);

  const { data: orders } = useQuery({
    queryKey: ["admin-new-orders"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unread = hydrated
    ? (orders ?? []).filter((o) => !seenAt || new Date(o.created_at) > new Date(seenAt)).length
    : 0;

  function openOrders() {
    const now = new Date().toISOString();
    window.localStorage.setItem(SEEN_KEY, now);
    setSeenAt(now);
    navigate({ to: "/admin", search: { tab: "orders" } });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openOrders}
      className="relative rounded-full text-primary-foreground hover:bg-primary-foreground/10"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
      <span className="sr-only">
        {unread > 0 ? `${unread} new orders` : "Orders"}
      </span>
    </Button>
  );
}
