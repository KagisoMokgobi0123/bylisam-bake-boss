import { formatDay } from "./format";

export type RewardRow = {
  id: string;
  user_id: string;
  reward_type: "free_muffin" | "percent_discount" | "fixed_discount";
  reward_value: number;
  points_spent: number;
  status: "active" | "redeemed" | "expired";
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
};

export function rewardTypeLabel(
  type: RewardRow["reward_type"],
  value: number | string,
): string {
  switch (type) {
    case "free_muffin":
      return "Free muffin";
    case "percent_discount":
      return `${Number(value)}% off your order`;
    case "fixed_discount":
      return `R${Number(value).toFixed(2)} off your order`;
  }
}

export function rewardLabel(reward: RewardRow) {
  const base = rewardTypeLabel(reward.reward_type, reward.reward_value);
  return reward.expires_at ? `${base} · expires ${formatDay(reward.expires_at)}` : base;
}

/** Works out the rand value of a reward against the prices in the basket. */
export function discountForReward(reward: RewardRow, unitPrices: number[]): number {
  const subtotal = unitPrices.reduce((a, b) => a + b, 0);
  switch (reward.reward_type) {
    case "free_muffin":
      return unitPrices.length ? Math.min(...unitPrices) : 0;
    case "percent_discount":
      return Math.round(subtotal * (Number(reward.reward_value) / 100) * 100) / 100;
    case "fixed_discount":
      return Math.min(Number(reward.reward_value), subtotal);
    default:
      return 0;
  }
}
