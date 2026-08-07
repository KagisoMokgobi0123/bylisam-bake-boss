import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Cookie, LayoutDashboard, LogOut, Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { useAppSettings } from "@/lib/queries";
import { useMuffinImageUrl } from "@/lib/muffin-images";
import { CartProvider } from "@/lib/cart";
import { CartButton } from "@/components/cart-button";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { AdminOrderBell } from "@/components/admin/order-bell";
import { CustomerNotificationBell } from "@/components/customer-bell";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/muffins", label: "Our muffins" },
  { to: "/feedback", label: "Feedback" },
] as const;

const customerLinks = [
  { to: "/orders", label: "My orders" },
  { to: "/rewards", label: "Rewards" },
  { to: "/profile", label: "Profile" },
] as const;


const adminTabs = [
  { tab: "overview", label: "Overview" },
  { tab: "orders", label: "Orders" },
  { tab: "walk-in", label: "Walk-ins" },
  { tab: "muffins", label: "Muffins & prices" },
  { tab: "reports", label: "Reports" },
  { tab: "profit", label: "Profit calculator" },
  { tab: "reviews", label: "Reviews" },
  { tab: "users", label: "Users" },
  { tab: "settings", label: "Settings" },
] as const;

const navClass =
  "rounded-full px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground data-[status=active]:bg-primary-foreground/15 data-[status=active]:text-primary-foreground";

const mobileNavClass =
  "rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent";

/** Small pill telling customers whether BYLISAM is currently taking fresh bakes. */
export function BusinessStatusPill({ compact }: { compact?: boolean }) {
  const { data: settings } = useAppSettings();
  if (!settings) return null;
  const open = settings.is_open ?? true;
  const name = settings.business_name || "BYLISAM";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        open ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
      } ${compact ? "" : "whitespace-nowrap"}`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-destructive"}`}
      />
      {open ? `${name} is now open for orders.` : `${name} is currently closed.`}
    </span>
  );
}

function BrandMark() {
  const { data: settings } = useAppSettings();
  const { data: logoUrl } = useMuffinImageUrl(settings?.business_logo_url || null);

  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <Cookie className="h-6 w-6" aria-hidden />
      )}
      {settings?.business_name || "BYLISAM"}
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useSession();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Admins get the management menu only; customers keep the shop menu.
  const links = isAdmin ? publicLinks.slice(0, 1) : publicLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-primary text-primary-foreground shadow-soft print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <BrandMark />

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className={navClass}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin
            ? adminTabs.map((item) => (
                <Link key={item.tab} to="/admin" search={{ tab: item.tab }} className={navClass}>
                  {item.label}
                </Link>
              ))
            : user
              ? customerLinks.map((link) => (
                  <Link key={link.to} to={link.to} className={navClass}>
                    {link.label}
                  </Link>
                ))
              : null}
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-2 xl:flex">
            {!isAdmin ? <BusinessStatusPill /> : null}
          </div>
          {isAdmin ? (
            <AdminOrderBell />
          ) : (
            <>
              <CustomerNotificationBell />
              <CartButton />
            </>
          )}
          <div className="hidden items-center gap-2 xl:flex">
            {user ? (
              <Button variant="secondary" size="sm" className="rounded-full" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            ) : (
              <Button asChild size="sm" variant="secondary" className="rounded-full">
                <Link to="/auth">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" /> Sign in
                </Link>
              </Button>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

          <SheetContent side="right" className="w-72 overflow-y-auto bg-card">
            <SheetTitle className="font-display text-lg text-primary">BYLISAM</SheetTitle>
            {!isAdmin ? (
              <div className="mt-3">
                <BusinessStatusPill compact />
              </div>
            ) : null}
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={mobileNavClass}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin ? (
                <>
                  <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Admin
                  </p>
                  {adminTabs.map((item) => (
                    <Link
                      key={item.tab}
                      to="/admin"
                      search={{ tab: item.tab }}
                      onClick={() => setOpen(false)}
                      className={mobileNavClass}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : user ? (
                <>
                  <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    My account
                  </p>
                  {customerLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={mobileNavClass}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              ) : null}

              <div className="mt-4">
                {user ? (
                  <Button className="w-full rounded-full" onClick={signOut}>
                    <LogOut className="mr-1.5 h-4 w-4" /> Sign out
                  </Button>
                ) : (
                  <Button asChild className="w-full rounded-full">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
          </Sheet>
        </div>
      </div>

    </header>
  );
}

export function SiteFooter() {
  const { data: settings } = useAppSettings();
  const name = settings?.business_name || "BYLISAM";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-card print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-base text-primary">
            <Cookie className="h-5 w-5" aria-hidden /> {name}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {settings?.business_slogan || "Baked fresh in residence, every day."}
          </p>
          {settings?.opening_hours ? (
            <p className="mt-2 text-sm text-muted-foreground">{settings.opening_hours}</p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Explore
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
            <li><Link to="/muffins" className="text-muted-foreground hover:text-primary">Our muffins</Link></li>
            <li><Link to="/feedback" className="text-muted-foreground hover:text-primary">Leave feedback</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Legal
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary">
                Privacy policy (POPIA)
              </Link>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" aria-hidden /> No card details ever stored
            </li>
          </ul>
          {settings?.business_address ? (
            <p className="mt-3 text-sm text-muted-foreground">{settings.business_address}</p>
          ) : null}
          {settings?.business_phone ? (
            <p className="text-sm text-muted-foreground">Tel: {settings.business_phone}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {year} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CheckoutDialog />
      </div>
    </CartProvider>
  );
}

