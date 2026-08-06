import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { MuffinImage } from "@/components/muffin-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { uploadMuffinImage } from "@/lib/muffin-images";
import { useAppSettings } from "@/lib/queries";

/** Half-hourly time slots offered in the opening-hours dropdowns. */
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 === 0 ? "00" : "30"}`;
});

/** Splits a stored "08:00 – 17:00" string back into its two dropdown values. */
function parseHours(value: string): [string, string] {
  const found = value.match(/\d{1,2}:\d{2}/g) ?? [];
  const pad = (t?: string) => (t ? t.padStart(5, "0") : "");
  return [pad(found[0]) || "08:00", pad(found[1]) || "17:00"];
}

/** Admin personal profile + business branding, hours and open/closed switch. */

export function BusinessSettings() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: settings } = useAppSettings();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [address, setAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [logo, setLogo] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setName(settings.business_name ?? "");
      setSlogan(settings.business_slogan ?? "");
      setAddress(settings.business_address ?? "");
      setBusinessPhone(settings.business_phone ?? "");
      setEmail(settings.business_email ?? "");
      const [o, c] = parseHours(settings.opening_hours ?? "");
      setOpenTime(o);
      setCloseTime(c);
      setLogo(settings.business_logo_url ?? "");
      setIsOpen(settings.is_open ?? true);
    }
  }, [settings]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (fullName.trim().length < 2) throw new Error("Please enter your full name.");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Your profile has been updated.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const saveBusiness = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("Please enter the business name.");
      const { error } = await supabase
        .from("app_settings")
        .update({
          business_name: name.trim(),
          business_slogan: slogan.trim(),
          business_address: address.trim(),
          business_phone: businessPhone.trim(),
          business_email: email.trim(),
          opening_hours: `${openTime} – ${closeTime}`,
          business_logo_url: logo,
          is_open: isOpen,
        })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Business details saved.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  async function handleLogo(file: File) {
    setUploading(true);
    try {
      const path = await uploadMuffinImage(file);
      setLogo(path);
      toast.success("Logo uploaded — remember to save.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg text-primary">My profile</h2>
          <div className="space-y-1.5">
            <Label htmlFor="ad-name">Full name (shown as cashier on receipts)</Label>
            <Input id="ad-name" maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-phone">Phone</Label>
            <Input id="ad-phone" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button className="rounded-full" disabled={saveProfile.isPending} onClick={() => saveProfile.mutate()}>
            {saveProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg text-primary">Business details</h2>

          <div className="flex items-center gap-4">
            <MuffinImage path={logo || null} alt="Business logo" className="h-20 w-20 rounded-2xl" />
            <div>
              <Label htmlFor="ad-logo" className="cursor-pointer text-sm font-medium text-primary">
                <span className="inline-flex items-center gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload logo
                </span>
              </Label>
              <Input
                id="ad-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogo(file);
                }}
              />
              <p className="text-xs text-muted-foreground">Square images look best.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-name">Business name</Label>
            <Input id="bs-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-slogan">Slogan</Label>
            <Input id="bs-slogan" maxLength={120} value={slogan} onChange={(e) => setSlogan(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-address">Address</Label>
            <Textarea id="bs-address" rows={2} maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bs-phone">Phone</Label>
              <Input id="bs-phone" maxLength={20} value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-email">Email</Label>
              <Input id="bs-email" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Opening hours</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bs-open-time" className="text-xs text-muted-foreground">
                  Opens
                </Label>
                <select
                  id="bs-open-time"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bs-close-time" className="text-xs text-muted-foreground">
                  Closes
                </Label>
                <select
                  id="bs-close-time"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown to customers as “Open {openTime} – {closeTime}”.
            </p>
          </div>


          <div className="flex items-center justify-between rounded-2xl surface-cream p-3">
            <div>
              <Label htmlFor="bs-open">Currently open for orders</Label>
              <p className="text-xs text-muted-foreground">
                When closed, customers can still order — they'll see a "reviewed when we re-open" notice.
              </p>
            </div>
            <Switch id="bs-open" checked={isOpen} onCheckedChange={setIsOpen} />
          </div>

          <Button className="rounded-full" disabled={saveBusiness.isPending} onClick={() => saveBusiness.mutate()}>
            {saveBusiness.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save business details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
