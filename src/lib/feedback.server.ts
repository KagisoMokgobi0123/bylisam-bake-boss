import { z } from "zod";

import { containsProfanity, PROFANITY_ERROR } from "./profanity";

export const feedbackInputSchema = z.object({
  customerName: z.string().trim().min(2, "Please tell us your name").max(80),
  orderReference: z.string().trim().max(40).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Please write a short review").max(1000),
  /** Honeypot — real people never fill this in. */
  website: z.string().max(0).optional().nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

/**
 * Stores a guest review (pending approval) after a simple per-IP rate limit,
 * so customers can leave feedback without creating an account.
 */
export async function submitGuestFeedback(input: FeedbackInput, clientKey: string) {
  if (containsProfanity(input.comment) || containsProfanity(input.customerName)) {
    throw new Error(PROFANITY_ERROR);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from("feedback_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("client_key", clientKey)
    .gte("created_at", since);
  if (countError) throw new Error("Could not send your feedback right now.");
  if ((count ?? 0) >= MAX_PER_WINDOW) {
    throw new Error("Thanks! You've already sent a few reviews — please try again later.");
  }

  const { error } = await supabaseAdmin.from("reviews").insert({
    user_id: null,
    customer_name: input.customerName,
    order_reference: input.orderReference || null,
    rating: input.rating,
    comment: input.comment,
    is_approved: false,
  });
  if (error) throw new Error("Could not send your feedback right now.");

  await supabaseAdmin.from("feedback_rate_limits").insert({ client_key: clientKey });
  return { ok: true as const };
}
