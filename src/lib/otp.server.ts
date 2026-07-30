import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export async function hashCode(code: string) {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

function otpEmailHtml(code: string) {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#FFFDF7;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#F5E9DA;border-radius:20px;padding:32px;text-align:center">
      <h1 style="font-size:22px;color:#6F4518;margin:0 0 8px">Welcome to BYLISAM</h1>
      <p style="color:#5b4636;font-size:14px;margin:0 0 24px">
        Use the code below to verify your email address and activate your account.
      </p>
      <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#6F4518;margin:0">${code}</p>
      <p style="color:#7a6553;font-size:12px;margin:24px 0 0">
        This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't sign up, you can ignore this email.
      </p>
    </div>
  </div>`;
}

async function sendEmail(to: string, code: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    throw new Error("Email sending is not configured yet.");
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: process.env.BYLISAM_EMAIL_FROM || "BYLISAM <onboarding@resend.dev>",
      to: [to],
      subject: `${code} is your BYLISAM verification code`,
      html: otpEmailHtml(code),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend request failed [${response.status}]: ${body}`);
    throw new Error(`Could not send the verification email [${response.status}]`);
  }
}

export async function issueOtpForUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) throw new Error("We couldn't find that account.");
  if (data.user.email_confirmed_at) return { alreadyVerified: true as const };

  const email = data.user.email;
  const code = generateCode();

  await supabaseAdmin
    .from("email_otps")
    .update({ consumed: true })
    .eq("user_id", userId)
    .eq("consumed", false);

  const { error: insertError } = await supabaseAdmin.from("email_otps").insert({
    user_id: userId,
    email,
    code_hash: await hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  });
  if (insertError) throw insertError;

  await sendEmail(email, code);
  return { alreadyVerified: false as const, email };
}

export async function verifyOtpForUser(userId: string, code: string) {
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!user.user) throw new Error("We couldn't find that account.");
  if (user.user.email_confirmed_at) return { verified: true as const };

  const { data: rows, error } = await supabaseAdmin
    .from("email_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;

  const otp = rows?.[0];
  if (!otp) throw new Error("No active code. Please request a new one.");
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    throw new Error("That code has expired. Please request a new one.");
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please request a new code.");
  }

  const matches = otp.code_hash === (await hashCode(code));
  if (!matches) {
    await supabaseAdmin
      .from("email_otps")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    throw new Error("That code isn't right. Please try again.");
  }

  await supabaseAdmin.from("email_otps").update({ consumed: true }).eq("id", otp.id);
  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (confirmError) throw confirmError;

  return { verified: true as const };
}
