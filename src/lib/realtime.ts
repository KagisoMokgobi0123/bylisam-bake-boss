import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps order-driven screens live: any insert/update on orders (or their items)
 * refreshes the given react-query keys, so no page refresh is ever needed.
 */
export function useOrdersRealtime(keys: string[]) {
  const queryClient = useQueryClient();
  const signature = keys.join("|");

  useEffect(() => {
    const invalidate = () => {
      for (const key of signature.split("|")) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    };

    const channel = supabase
      .channel(`orders-live-${signature}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, signature]);
}
