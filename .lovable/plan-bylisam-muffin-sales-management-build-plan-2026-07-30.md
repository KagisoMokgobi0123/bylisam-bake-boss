# BYLISAM Muffin Sales Management — Build Plan

A full business management platform for a homemade muffin business in a student residence. No online payments, no card data — only the chosen payment method is recorded.

## Design direction

- Brown primary (nav, buttons, headings), Cream cards/sections, Ivory page background.
- Rounded cards and buttons, warm bakery typography, muffin-themed icons and subtle illustrations, smooth transitions, colour-coded status badges.
- Fully responsive: desktop, tablet, mobile.

## Backend (Lovable Cloud)

Enabled in Phase 1. Tables (all with row-level security):

- `profiles` — name, email, phone (optional), points balance
- `user_roles` — separate roles table (`admin` / `customer`) with a security-definer role check
- `muffins` — name, flavour, description, price, stock, active, image
- `orders` — customer or walk-in, phone, student flag, payment method, total, status, collected time
- `order_items` — muffin, qty, unit price at time of order
- `rewards` / `reward_settings` — earned rewards, expiry, and admin-configurable rules
- `settings` — business name, WhatsApp message template, receipt footer

Stored data is limited to name, email, hashed password (handled by auth), optional phone, points and order history. No banking or card fields anywhere.

## Phase 1 — Core

1. Cloud + auth: student registration (name, email, password) with **email OTP verification via Resend** before activation; login with email + password. Admin role assigned via the roles table.
2. Muffin catalogue: admin CRUD for muffins, flavours, prices, stock.
3. Customer storefront: browse muffins, cart, place order, choose payment method (Cash / EFT), order confirmation.
4. Order tracking: Pending → Approved → Ready for Collection → Collected, with status badges.
5. Admin orders board: review, approve, advance status, mark collected (records the sale automatically).
6. Admin dashboard shell with navigation to all modules.

## Phase 2 — Business tools

1. Loyalty programme: admin-configured points per muffin/purchase, eligible products, redemption threshold, reward type (free muffin / % discount / fixed discount), auto-expiry period. Points awarded on collection; redemption at checkout; expiry dates shown.
2. Walk-in order panel: phone number, student/non-student, muffins + quantities, payment method, auto total, receipt.
3. Receipts: printable/downloadable receipt per order.
4. **WhatsApp click-to-send**: on marking an order collected, the admin gets a WhatsApp button that opens a chat to the customer's number pre-filled with the receipt summary and the thank-you message. No Twilio, no cost.
5. Sales reports: revenue by day/week/month, top flavours, payment-method breakdown, walk-in vs registered, reward usage.
6. Customer management, rewards balances, profile page, order history, system settings.

## Technical notes

- TanStack Start routes: public (`/`, `/muffins`, `/auth`) and gated (`_authenticated/*` for customer, admin routes gated by the roles table).
- Data access via server functions with the authenticated Supabase client; admin actions verify the admin role server-side.
- Resend connected as a connector; OTP codes generated and verified server-side with short expiry and attempt limits. A verified sending domain in Resend is needed for real delivery to students.
- WhatsApp uses `wa.me` deep links built from the order — nothing is sent from the server.
- Input validated with Zod on both client and server.

## What I need from you later

- A Resend account connection (and ideally a verified domain) when Phase 1 auth is wired up.
- The BYLISAM WhatsApp/business phone number and any exact receipt wording.
