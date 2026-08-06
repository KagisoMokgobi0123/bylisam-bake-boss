import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";


import { PageShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { useRewardSettings } from "@/lib/queries";
import { rewardTypeLabel, type RewardRow } from "@/lib/rewards";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Loyalty Points & Rewards — BYLISAM" },
      {
        name: "description",
        content:
          "See your BYLISAM loyalty points, redeem them for a free muffin or a discount, and check when each reward expires.",
      },
      { property: "og:title", content: "Loyalty Points & Rewards — BYLISAM" },
      { property: "og:description", content: "Track your loyalty points and redeem rewards." },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: settings } = useRewardSettings();
  const navigate = useNavigate();

  const { data: rewards } = useQuery({
    queryKey: ["rewards-list", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RewardRow[];
    },
  });

  const points = profile?.points ?? 0;
  const threshold = Math.max(1, settings?.min_redemption_points ?? 10);
  const canRedeem = !!settings?.is_active && points >= threshold;
  const freeMuffins = Math.floor(points / threshold);

  /** Redeeming is done in the cart, so send the customer off to pick muffins. */
  function startRedemption() {
    toast.success(
      `Pick your muffins — ${freeMuffins} of them will be free at checkout. 🎁`,
    );
    navigate({ to: "/muffins" });
  }

  const active = (rewards ?? []).filter(
    (r) => r.status === "active" && (!r.expires_at || new Date(r.expires_at) > new Date()),
  );
  const history = (rewards ?? []).filter((r) => !active.includes(r));


  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl text-primary">Rewards</h1>
        <p className="mt-2 text-muted-foreground">
          Every muffin earns points. Cash them in for something on the house.
        </p>

        <Card className="mt-8 rounded-3xl">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 font-display text-5xl text-primary">{points}</p>
            <p className="text-sm text-muted-foreground">loyalty points</p>

            <div className="mt-6">
              <Progress value={Math.min(100, (points / Math.max(1, threshold)) * 100)} />
              <p className="mt-2 text-sm text-muted-foreground">
                {canRedeem
                  ? "You have enough points to claim a reward!"
                  : `${Math.max(0, threshold - points)} more points until your next reward.`}
              </p>
            </div>

            {settings ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Current reward:{" "}
                <span className="font-semibold text-primary">
                  {rewardTypeLabel(settings.reward_type, settings.reward_value)}
                </span>{" "}
                for {threshold} points
                {settings.expiry_days ? `, valid ${settings.expiry_days} days` : ""}.
              </p>
            ) : null}

            <Button
              className="mt-6 rounded-full"
              size="lg"
              disabled={!canRedeem}
              onClick={startRedemption}
            >
              Redeem points
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {canRedeem
                ? "Pick your muffins, add them to the cart and switch on \"Redeem points\" at checkout."
                : "Keep ordering to reach your next free muffin."}
            </p>

          </CardContent>
        </Card>

        <h2 className="mt-10 font-display text-xl text-primary">Available rewards</h2>
        <div className="mt-3 space-y-3">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active rewards right now.</p>
          ) : (
            active.map((reward) => (
              <Card key={reward.id} className="rounded-2xl">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" aria-hidden />
                    <div>
                      <p className="font-semibold text-primary">
                        {rewardTypeLabel(reward.reward_type, reward.reward_value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDay(reward.expires_at)}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                    Ready to use
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {history.length > 0 ? (
          <>
            <h2 className="mt-10 font-display text-xl text-primary">Reward history</h2>
            <div className="mt-3 space-y-2">
              {history.map((reward) => (
                <div
                  key={reward.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-5 py-3 text-sm"
                >
                  <span>{rewardTypeLabel(reward.reward_type, reward.reward_value)}</span>
                  <span className="text-muted-foreground">
                    {reward.status === "redeemed" ? "Used" : "Expired"}{" "}
                    {formatDay(reward.redeemed_at ?? reward.expires_at)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
