import { Badge } from "@/components/ui/badge";
import { STATUS_CLASSES, STATUS_LABELS, type OrderStatus } from "@/lib/format";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`rounded-full ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
