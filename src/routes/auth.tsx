import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Cookie, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { sendSignupOtp, verifySignupOtp } from "@/lib/otp.functions";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or Register — BYLISAM" },
      {
        name: "description",
        content:
          "Create your BYLISAM student account with email verification, or sign in to order muffins and track your loyalty rewards.",
      },
      { property: "og:title", content: "Sign in or Register — BYLISAM" },
      {
        property: "og:description",
        content: "Create your BYLISAM account or sign in to order muffins and earn rewards.",
      },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");
  const [pending, setPending] = useState(false);

  // registration state
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const sendOtp = useServerFn(sendSignupOtp);
  const verifyOtp = useServerFn(verifySignupOtp);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ fullName, email: regEmail, password: regPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: parsed.data.fullName },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("We couldn't start your registration. Please try again.");
      await sendOtp({ data: { userId } });
      setPendingUserId(userId);
      toast.success(
        "Registration successful! Please check your email and enter the verification code to confirm your account before signing in.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingUserId) return;
    setPending(true);
    try {
      await verifyOtp({ data: { userId: pendingUserId, code } });
      const { error } = await supabase.auth.signInWithPassword({
        email: regEmail,
        password: regPassword,
      });
      if (error) throw error;
      toast.success("Email verified — welcome to BYLISAM! 🧁");
      navigate({ to: "/order" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (!pendingUserId) return;
    setPending(true);
    try {
      await sendOtp({ data: { userId: pendingUserId } });
      toast.success("A new code is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the code");
    } finally {
      setPending(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/order" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
        <Cookie className="h-10 w-10 text-primary" aria-hidden />
        <h1 className="mt-3 text-center font-display text-3xl text-primary">
          {pendingUserId ? "Verify your email" : "Welcome to BYLISAM"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {pendingUserId
            ? `We sent a 6-digit code to ${regEmail}.`
            : "Order fresh muffins, track collection and earn loyalty rewards."}
        </p>

        <Card className="mt-8 w-full rounded-3xl">
          <CardContent className="p-6">
            {pendingUserId ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex justify-center">
                  <MailCheck className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <p className="rounded-2xl surface-cream p-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Registration successful!</span>{" "}
                  Please check your email and enter the verification code below to confirm your
                  account before signing in.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>

                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-[0.5em]"
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={pending}>
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify &amp; activate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-full"
                  onClick={handleResend}
                  disabled={pending}
                >
                  Resend code
                </Button>
              </form>
            ) : (
              <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                  <TabsTrigger value="login" className="rounded-full">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-full">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full" disabled={pending}>
                      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sign in
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full name</Label>
                      <Input
                        id="full-name"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email address</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        At least 8 characters. We store your password securely hashed — never in
                        plain text.
                      </p>
                    </div>
                    <Button type="submit" className="w-full rounded-full" disabled={pending}>
                      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          We only store your name, email, and (optionally) a phone number for collection
          notifications. BYLISAM never asks for card or banking details.
        </p>
      </div>
    </PageShell>
  );
}
