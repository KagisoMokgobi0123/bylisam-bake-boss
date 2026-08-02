import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — BYLISAM" },
      {
        name: "description",
        content:
          "Update the name and optional phone number BYLISAM uses for your muffin orders and collection notifications.",
      },
      { property: "og:title", content: "My Profile — BYLISAM" },
      { property: "og:description", content: "Manage your BYLISAM account details." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+ ]*$/, "Use digits only")
    .optional()
    .or(z.literal("")),
});

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ full_name: fullName, phone });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-display text-3xl text-primary">My profile</h1>
        <p className="mt-2 text-muted-foreground">
          Keep your details up to date so we can let you know when your muffins are ready.
        </p>

        <Card className="mt-8 rounded-3xl">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={profile?.email ?? user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input
                id="phone"
                value={phone}
                placeholder="e.g. 0821234567"
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only used to send you a WhatsApp receipt when you collect.
              </p>
            </div>
            <Button
              className="rounded-full"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-3xl">
          <CardContent className="flex gap-3 p-6 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p>
              BYLISAM stores only your name, email, optional phone number, reward points and order
              history. We never store card numbers, banking details or payment credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
