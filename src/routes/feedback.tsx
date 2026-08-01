import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-shell";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDay } from "@/lib/format";
import { submitFeedback } from "@/lib/feedback.functions";
import { useApprovedReviews } from "@/lib/reviews";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Leave Feedback — BYLISAM Muffins" },
      {
        name: "description",
        content:
          "Tell us how your BYLISAM muffins were. Rate your order out of five stars, leave a review and read what other students say. No account needed.",
      },
      { property: "og:title", content: "Leave Feedback — BYLISAM Muffins" },
      {
        property: "og:description",
        content: "Rate your order and read reviews from other BYLISAM customers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { data: reviews } = useApprovedReviews();
  const queryClient = useQueryClient();
  const send = useServerFn(submitFeedback);

  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: async () =>
      send({
        data: {
          customerName: name.trim(),
          orderReference: reference.trim() || null,
          rating,
          comment: comment.trim(),
          website,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setSubmitted(true);
      setComment("");
      setReference("");
      toast.success("Thank you! Your review will appear once we've approved it.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not send your feedback"),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            Your voice matters
          </p>
          <h1 className="font-display text-3xl text-primary md:text-4xl">
            How were your muffins?
          </h1>
          <p className="mt-3 text-muted-foreground">
            No account needed — just rate your order and tell us what you thought. Every review
            helps us bake better and helps other students choose their next treat.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
          <Card className="h-fit rounded-3xl lg:sticky lg:top-24">
            <CardContent className="space-y-5 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl text-primary">
                <MessageSquareHeart className="h-5 w-5" aria-hidden /> Leave a review
              </h2>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fb-name">Your name</Label>
                  <Input
                    id="fb-name"
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-ref">Order number (optional)</Label>
                  <Input
                    id="fb-ref"
                    maxLength={40}
                    placeholder="BYL-XXXXXX"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your rating</Label>
                  <StarRating value={rating} onChange={setRating} size="lg" label="Your rating" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-comment">Your review</Label>
                  <Textarea
                    id="fb-comment"
                    rows={4}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="The chocolate muffin was still warm — perfect!"
                    required
                  />
                </div>

                {/* Honeypot: hidden from people, tempting for bots. */}
                <div className="hidden" aria-hidden>
                  <Label htmlFor="fb-website">Website</Label>
                  <Input
                    id="fb-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full rounded-full" disabled={submit.isPending}>
                  {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit feedback
                </Button>

                <p className="text-xs text-muted-foreground">
                  To keep reviews genuine we limit how many can be sent from one device each hour.
                </p>

                {submitted ? (
                  <p className="rounded-2xl surface-cream p-3 text-sm text-muted-foreground">
                    Thanks! Your review is waiting for approval and will be published on our
                    homepage shortly.
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="font-display text-2xl text-primary">What students are saying</h2>
            {(reviews ?? []).length === 0 ? (
              <p className="text-muted-foreground">
                No reviews published yet — be the first to share your thoughts.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(reviews ?? []).map((review) => (
                  <Card key={review.id} className="rounded-2xl">
                    <CardContent className="space-y-2 p-5">
                      <StarRating value={review.rating} />
                      <p className="text-sm text-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.customer_name} · {formatDay(review.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
