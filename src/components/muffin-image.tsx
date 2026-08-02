import { Cookie } from "lucide-react";

import { useMuffinImageUrl } from "@/lib/muffin-images";
import { cn } from "@/lib/utils";

type Props = {
  path?: string | null;
  alt: string;
  className?: string;
};

/** Shows a muffin photo when one is uploaded, otherwise a warm placeholder tile. */
export function MuffinImage({ path, alt, className }: Props) {
  const { data: url } = useMuffinImageUrl(path);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-2xl surface-cream",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Cookie className="h-8 w-8 text-primary/40" aria-hidden />
      )}
    </div>
  );
}
