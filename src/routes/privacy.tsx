import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy (POPIA) — BYLISAM Muffins" },
      {
        name: "description",
        content:
          "How BYLISAM collects, stores and uses your personal information under South Africa's POPIA. We only keep your name, email address and cell phone number.",
      },
      { property: "og:title", content: "Privacy Policy (POPIA) — BYLISAM Muffins" },
      {
        property: "og:description",
        content: "How BYLISAM handles your personal information under POPIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "What we collect",
    body: "We only collect your name, email address and cell phone number. Nothing else about you is stored — we never ask for, process or keep card, banking or payment information of any kind.",
  },
  {
    title: "Why we collect it",
    body: "Your name identifies your order at collection, your email secures your account and verification codes, and your cell number lets us send your receipt and collection updates on WhatsApp. Where you place an order we also record your student residence so we can plan baking and collections.",
  },
  {
    title: "How we store it",
    body: "Your information is stored in a secured, access-controlled database. Passwords are never stored in readable form — they are protected with strong one-way hashing. Only the BYLISAM owner can view customer records.",
  },
  {
    title: "How long we keep it",
    body: "We keep your account and order history for as long as your account is active. Ask us to close your account and we will delete your personal information, keeping only anonymous sales totals.",
  },
  {
    title: "Sharing",
    body: "We never sell or share your personal information with third parties for marketing. Messages you receive are sent directly by us through WhatsApp using the number you gave us.",
  },
  {
    title: "Your rights under POPIA",
    body: "You may ask to see, correct or delete the personal information we hold about you, or object to how we use it, at any time. Contact BYLISAM and we will action your request.",
  },
];

function PrivacyPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ShieldCheck className="h-9 w-9 text-primary" aria-hidden />
        <h1 className="mt-3 font-display text-3xl text-primary md:text-4xl">
          Privacy policy &amp; POPIA notice
        </h1>
        <p className="mt-3 text-muted-foreground">
          BYLISAM respects your privacy. This notice explains, in plain language, what personal
          information we collect and how it is protected under the Protection of Personal
          Information Act (POPIA).
        </p>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="font-display text-lg text-primary">{section.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Questions about your information? <Link to="/feedback" className="font-semibold text-primary hover:underline">Get in touch</Link>.
        </p>
      </div>
    </PageShell>
  );
}
