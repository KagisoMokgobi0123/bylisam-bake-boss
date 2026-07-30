import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sendSchema = z.object({ userId: z.string().uuid() });
const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const sendSignupOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data }) => {
    const { issueOtpForUser } = await import("./otp.server");
    return issueOtpForUser(data.userId);
  });

export const verifySignupOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { verifyOtpForUser } = await import("./otp.server");
    return verifyOtpForUser(data.userId, data.code);
  });
