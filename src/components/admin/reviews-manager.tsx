import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { useAllReviews } from "@/lib/reviews";

export function ReviewsManager() {
  const { data: reviews, isLoading } = useAllReviews();
  const queryClient = useQueryClient();

  const setApproved = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review updated.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted.");
    },
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  const all = reviews ?? [];
  const pending = all.filter((r) => !r.is_approved);
  const approved = all.filter((r) => r.is_approved);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Reviews only appear on the homepage and feedback page once you approve them.
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-primary">
          Waiting for approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to review right now.</p>
        ) : (
          pending.map((review) => (
            <Card key={review.id} className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-base text-primary">{review.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                      {review.order_reference ? ` · ${review.order_reference}` : ""}
                    </p>
                  </div>
                  <StarRating value={review.rating} />
                </div>
                <p className="text-sm">{review.comment}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={setApproved.isPending}
                    onClick={() => setApproved.mutate({ id: review.id, approved: true })}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove.mutate(review.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-primary">Published ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published reviews yet.</p>
        ) : (
          approved.map((review) => (
            <Card key={review.id} className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-base text-primary">
                      {review.customer_name}
                      <Badge variant="outline" className="ml-2 rounded-full text-xs">
                        Live
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                  <StarRating value={review.rating} />
                </div>
                <p className="text-sm">{review.comment}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setApproved.mutate({ id: review.id, approved: false })}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove.mutate(review.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
