import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Cookie, LayoutDashboard, LogOut, Menu, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/muffins", label: "Our muffins" },
  { to: "/feedback", label: "Feedback" },
] as const;

const adminTabs = [
  { tab: "overview", label: "Overview" },
  { tab: "orders", label: "Orders" },
  { tab: "walk-in", label: "New order" },
  { tab: "muffins", label: "Muffins" },
  { tab: "profit", label: "Profit" },
  { tab: "reviews", label: "Reviews" },
] as const;

const navClass =
  "rounded-full px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground data-[status=active]:bg-primary-foreground/15 data-[status=active]:text-primary-foreground";

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

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-primary text-primary-foreground shadow-soft">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Cookie className="h-6 w-6" aria-hidden />
          BYLISAM
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((link) => (
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
                <Link
                  key={item.tab}
                  to="/admin"
                  search={{ tab: item.tab }}
                  className={navClass}
                >
                  {item.label}
                </Link>
              ))
            : null}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button variant="secondary" size="sm" className="rounded-full" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link to="/auth">
                <LayoutDashboard className="mr-1.5 h-4 w-4" /> Staff sign in
              </Link>
            </Button>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto bg-card">
            <SheetTitle className="font-display text-lg text-primary">BYLISAM</SheetTitle>
            <nav className="mt-6 flex flex-col gap-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {item.label}
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
                      Staff sign in
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-display text-base text-primary">
          <Cookie className="h-5 w-5" aria-hidden /> BYLISAM
        </p>
        <p className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden /> Baked fresh in residence, every day.
        </p>
        <p className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" aria-hidden /> Collect &amp; pay in person — no card details ever stored.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
