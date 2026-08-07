import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrdersRealtime } from "@/lib/realtime";

/**
 * Bell in the admin navbar. Counts every customer order that still needs
 * attention — the badge only clears once an order is completed or cancelled.
 */
export function AdminOrderBell() {
  const navigate = useNavigate();
  useOrdersRealtime(["admin-active-orders", "admin-orders"]);

  const { data: active } = useQuery({
    queryKey: ["admin-active-orders"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("is_walk_in", false)
        .not("status", "in", "(collected,cancelled)");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const unread = active ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate({ to: "/admin", search: { tab: "orders" } })}
      className="relative rounded-full text-primary-foreground hover:bg-primary-foreground/10"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
      <span className="sr-only">
        {unread > 0 ? `${unread} active customer orders` : "Orders"}
      </span>
    </Button>
  );
}
