import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const MUFFIN_BUCKET = "muffin-images";

/** Uploads a muffin photo and returns the storage path stored on the muffin row. */
export async function uploadMuffinImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MUFFIN_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

/**
 * Muffin images are stored as bucket paths (or, for older rows, as full URLs).
 * Signed URLs keep the bucket private while still rendering to every visitor.
 */
export function useMuffinImageUrl(imagePath?: string | null) {
  return useQuery({
    queryKey: ["muffin-image", imagePath],
    enabled: !!imagePath,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!imagePath) return null;
      if (/^https?:\/\//.test(imagePath)) return imagePath;
      const { data, error } = await supabase.storage
        .from(MUFFIN_BUCKET)
        .createSignedUrl(imagePath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
