import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useOrdersRealtime } from "@/lib/realtime";

const SEEN_KEY = "bylisam-order-status-seen";

type SeenMap = Record<string, string>;

function readSeen(): SeenMap {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

/** Bell for customers: lights up whenever one of their orders moves forward. */
export function CustomerNotificationBell() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [seen, setSeen] = useState<SeenMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSeen(readSeen());
    setHydrated(true);
  }, []);

  useOrdersRealtime(["my-order-updates", "my-orders"]);

  const { data: orders } = useQuery({
    queryKey: ["my-order-updates", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updated = hydrated
    ? (orders ?? []).filter(
        (o) =>
          ["approved", "ready", "collected"].includes(o.status) && seen[o.id] !== o.status,
      )
    : [];
  const unread = updated.length;

  function openOrders() {
    const next: SeenMap = { ...seen };
    for (const order of orders ?? []) next[order.id] = order.status;
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
    setSeen(next);
    navigate({ to: "/orders" });
  }

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openOrders}
      className="relative rounded-full text-primary-foreground hover:bg-primary-foreground/10"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
      <span className="sr-only">
        {unread > 0 ? `${unread} order updates` : "Order updates"}
      </span>
    </Button>
  );
}
