import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { PageShell } from "@/components/site-shell";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Your Password — BYLISAM" },
      {
        name: "description",
        content:
          "Choose a new password for your BYLISAM staff account using the secure, time-limited link we emailed you.",
      },
      { property: "og:title", content: "Reset Your Password — BYLISAM" },
      { property: "og:description", content: "Set a new BYLISAM account password securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Supabase turns the recovery link into a session on load.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: got }) => {
      if (got.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in.");
      navigate({ to: "/admin", search: { tab: "overview" } });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "That reset link has expired. Please request a new one.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
        <KeyRound className="h-10 w-10 text-primary" aria-hidden />
        <h1 className="mt-3 text-center font-display text-3xl text-primary">Set a new password</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Reset links expire shortly after they're sent and can only be used once.
        </p>

        <Card className="mt-8 w-full rounded-3xl">
          <CardContent className="p-6">
            {!ready ? (
              <div className="space-y-4 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                <p>
                  Open this page from the reset link in your email. If the link has expired,
                  request a new one from the sign-in page.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/auth">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  At least 8 characters. Passwords are stored only as a strong salted hash.
                </p>
                <Button type="submit" className="w-full rounded-full" disabled={pending}>
                  {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
