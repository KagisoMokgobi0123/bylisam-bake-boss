import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "sm",
  label,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
  label?: string;
}) {
  const dimension = size === "lg" ? "h-7 w-7" : "h-4 w-4";

  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden
            className={cn(
              dimension,
              star <= value ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label ?? "Rating"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            aria-hidden
            className={cn(
              dimension,
              star <= value ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
