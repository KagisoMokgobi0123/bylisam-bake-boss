import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Muffin = {
  id: string;
  name: string;
  flavour: string;
  description: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  earns_points: boolean;
  points_value: number;
};

export function useMuffins(onlyAvailable = true) {
  return useQuery({
    queryKey: ["muffins", onlyAvailable],
    queryFn: async () => {
      let query = supabase.from("muffins").select("*").order("name");
      if (onlyAvailable) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Muffin[];
    },
  });
}

export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRewardSettings() {
  return useQuery({
    queryKey: ["reward-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reward_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
