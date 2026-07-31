import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  user_id: string | null;
  order_id: string | null;
  order_reference: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
};

/** Publicly visible reviews (RLS only returns approved rows to anonymous visitors). */
export function useApprovedReviews(limit = 12) {
  return useQuery({
    queryKey: ["reviews", "approved", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });
}

/** Every review — admins see all rows, customers only their own. */
export function useAllReviews(enabled = true) {
  return useQuery({
    queryKey: ["reviews", "all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });
}
