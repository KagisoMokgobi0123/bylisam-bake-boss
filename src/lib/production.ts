import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProductionCost = {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
};

export type ProductionSettings = {
  id: boolean;
  batch_yield: number;
  selling_price: number;
};

export function useProductionCosts(enabled = true) {
  return useQuery({
    queryKey: ["production-costs"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_costs")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as ProductionCost[];
    },
  });
}

export function useProductionSettings(enabled = true) {
  return useQuery({
    queryKey: ["production-settings"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProductionSettings | null;
    },
  });
}
