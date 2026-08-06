import { Truck } from "lucide-react";

import { useAppSettings } from "@/lib/queries";

export const DEFAULT_ADDRESS = "21 Chapel";

/** Delivery + collection info shown across the customer ordering experience. */
export function DeliveryNotice({ compact }: { compact?: boolean }) {
  const { data: settings } = useAppSettings();
  const address = settings?.business_address?.trim() || DEFAULT_ADDRESS;

  return (
    <div className="flex items-start gap-3 rounded-2xl surface-cream p-4 text-sm">
      <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold text-primary">Free delivery around town</p>
        <p className="text-muted-foreground">{address}</p>
        {compact ? null : (
          <p className="mt-1 text-muted-foreground">
            Free deliveries are available within town only (unless we meet at campus).
          </p>
        )}
      </div>
    </div>
  );
}
