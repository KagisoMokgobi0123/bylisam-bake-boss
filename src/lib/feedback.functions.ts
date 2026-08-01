import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { feedbackInputSchema } from "./feedback.server";

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => feedbackInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { submitGuestFeedback } = await import("./feedback.server");
    const request = getRequest();
    const clientKey =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    return submitGuestFeedback(data, clientKey);
  });
