# Architect Interview Transcript: Lane Booking

> Simulated interview for the lane booking feature on the RangeOps codebase.
> No PRD, scope doc, UX spec, or glossary found in `./plans/`.

---

## Preamble

**Assistant:** I've explored the codebase. No PRD, UX spec, or glossary found -- working from your verbal requirements. That's fine, but note that defined requirements make for a better design.

Stack: Next.js 16 (with `proxy.ts` for subdomain routing), Drizzle ORM on Neon Postgres, Effect for business logic, Better Auth with org plugin, Stripe Connect for tenant payments, Stripe platform billing for SaaS. Multi-tenant via subdomain routing (`{slug}.getrangeops.dev`). Turborepo monorepo with `apps/web` and `packages/email`.

Key existing models: `organization`, `location`, `customer`, `resource` + `resourceType` (with `capacity`, `parentResourceId`, `bookingUnit`), `offering` + `offeringPrice` + `offeringRule`, `subscription`, `entitlementGrant` / `entitlementLedger` / `entitlementBalance`, `organizationSetting.bookingRules` (JSONB). `organizationPaymentAccount` stores Stripe Connect account IDs.

I notice `resource` already has `capacity`, `bookingUnit` on `resourceType`, and `parentResourceId` for hierarchical resources. The `organizationSetting` table has a `bookingRules` JSONB column already stubbed out. This gives us a foundation.

First question:

---

## Domain 1: Architecture & Patterns

**Assistant:** [Header: Architecture]

The codebase uses a consistent pattern: Zod schema -> Effect-based service function -> server action -> RSC page. Business logic lives in `src/lib/*.ts` files, server actions in `src/app/[orgSlug]/**/actions.ts`, and cached queries in `src/lib/queries.ts`.

For lane booking, I see two high-level approaches:

1. **Extend existing modules** -- Add booking tables to `src/lib/db/schema/`, booking logic to `src/lib/bookings.ts`, actions under `src/app/[orgSlug]/bookings/actions.ts`, pages at `src/app/[orgSlug]/bookings/`. Follows existing patterns exactly.
2. **Separate booking service** -- Extract booking into its own package under `packages/booking/`. More isolated but deviates from current architecture.

Given the codebase is early-stage and everything else lives in `apps/web`, I recommend option 1. The project already handles far more complex domains (entitlements, subscriptions) within the same app. Does that work?

**User:** Yes, option 1. Keep everything in apps/web following the existing patterns.

**Assistant:** [Header: API Design]

For the booking API surface, the existing pattern uses server actions (not API routes) for mutations. The only API routes are `/api/auth/[...all]` and `/api/webhooks/{stripe,resend}`.

For lane booking, we need:
- Mutations: create booking, cancel booking, check in, admin override
- Queries: available slots, customer bookings, lane schedule view

I recommend server actions for mutations and cached RSC queries for reads, matching the existing pattern. One exception: if walk-ins need a public booking page (no auth), we may need an API route for slot availability. Does the walk-in booking happen through:

(a) A public-facing page on the org subdomain (no login required)
(b) Staff creates the booking on behalf of the walk-in from the operator dashboard
(c) Both -- public page for self-service, staff dashboard for in-person

**User:** Option C. Walk-ins can book online through a public page, and staff can also create bookings from the dashboard. Members always book through the authenticated dashboard.

**Assistant:** [Header: Public Route]

Got it. So we need a public route at something like `https://{slug}.getrangeops.dev/book` that doesn't require auth. Currently the `[orgSlug]/layout.tsx` enforces auth and membership checks. The public booking page needs to bypass that.

I recommend a route group: `src/app/[orgSlug]/(public)/book/page.tsx` with its own layout that skips the auth/membership check but still resolves the org from the slug. The org layout's auth guard won't apply because the `(public)` route group gets its own layout.

The authenticated booking management pages would stay in the existing `(authenticated)` layout area alongside customers, settings, etc.

Does that approach work?

**User:** Yes. Clean separation. Let's do it.

---

## Domain 2: Data & State

**Assistant:** [Header: Data Model]

The `resource` table already models bookable assets. I found `resourceType` has a `bookingUnit` field and `resource` has `capacity`. A lane would be a `resource` with `resourceType` of slug `pistol-lane` or `rifle-lane`.

For bookings, I propose these new tables:

**`booking`** -- core reservation record
- `id`, `organizationId`, `locationId`, `resourceId`, `customerId` (nullable for walk-ins)
- `status`: enum (`pending`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`)
- `startTime`, `endTime` (timestamptz)
- `bookerType`: enum (`member`, `walk_in`)
- `paymentMethod`: enum (`entitlement`, `stripe`, `free`, `cash`)
- `stripePaymentIntentId` (nullable)
- `walkInName`, `walkInEmail`, `walkInPhone` (for unauthenticated walk-ins)
- Standard: `metadata`, `createdAt`, `updatedAt`, `createdByUserId`

**`booking_event`** -- append-only status history (same pattern as `subscriptionChangeEvent`)
- `id`, `organizationId`, `bookingId`, `eventType`, `previousStatus`, `newStatus`, `metadata`, `createdAt`

No need for a separate `time_slot` table -- we compute available slots from existing bookings + location operating hours stored in `organizationSetting.bookingRules`.

The `bookingRules` JSONB on `organizationSetting` would store:
- `slotDurationMinutes` (e.g., 30, 60)
- `maxAdvanceBookingDays`
- `cancellationWindowMinutes`
- `operatingHours` per day-of-week per location

Does this data model look right?

**User:** That's good. One thing -- I want the booking to be per-lane, not per-lane-type. If there are 10 pistol lanes, you book a specific lane. And I want to support the case where a range has different prices for different time slots (peak vs off-peak). How does that work with the existing offering/price model?

**Assistant:** [Header: Slot Pricing]

Good call on per-lane booking -- that maps perfectly to the existing `resource` table where each lane is its own row.

For peak/off-peak pricing, the existing `offeringRule` table is designed for exactly this. An offering of type `pass` (one-time lane rental) would have:
- An `offeringPrice` for the base rate
- `offeringRule` rows with `ruleType: 'time_of_day_modifier'` containing `{ dayOfWeek: [5,6], startHour: 10, endHour: 16, priceId: "opr_peak123" }`

Alternatively, simpler approach: create separate offerings per pricing tier ("Pistol Lane - Standard", "Pistol Lane - Weekend Peak") and resolve which one applies based on the requested time slot.

I recommend the simpler approach -- separate offerings per tier. The `offeringRule` approach is more flexible but adds query complexity. Since this is v1 and the operator configures offerings manually anyway, explicit offerings are clearer.

The booking record would reference the `offeringPriceId` used, snapshotting the amount at booking time (same pattern as `subscription.amountCentsSnapshot`).

**User:** Separate offerings per tier. Simpler is better for v1.

**Assistant:** [Header: Walk-in Data]

For walk-in customers who book online, they provide name/email/phone but have no `customer` record yet. Two options:

1. **Create a `customer` record on booking** with status `lead`. This means walk-ins automatically enter the CRM. If they come back, staff can link/merge.
2. **Store walk-in info on the booking only** (`walkInName`, `walkInEmail`, `walkInPhone`). No customer record until staff explicitly creates one.

I recommend option 1. The `customer` table already has a `lead` status and the fields map cleanly. When a walk-in books, we auto-create a customer with `status: 'lead'`. If that email already exists for the org, we link to the existing customer instead.

**User:** Option 1. Auto-create leads. Good for the CRM funnel.

---

## Domain 3: Core Behavior (Technical)

**Assistant:** [Header: Book Flow]

Let me walk through the booking flows step-by-step.

**Member booking flow:**
1. Authenticated member navigates to `/book` or booking section in dashboard
2. Selects location (from location selector already in sidebar), date, and time slot
3. System queries available lanes for that slot (resource WHERE type matches AND no conflicting confirmed booking)
4. Member selects lane type (pistol/rifle) -- system auto-assigns a specific lane or lets them pick
5. System checks entitlement balance (`entitlementType: 'range_access'` or similar)
6. If sufficient balance: consume entitlement, create booking with `paymentMethod: 'entitlement'`, status `confirmed`
7. If insufficient: show option to pay via Stripe (using their connected account payment method)

Question: should members be auto-assigned a lane, or pick a specific one?

**User:** Auto-assign. Members pick a lane type, not a specific lane number. System picks the best available lane.

**Assistant:** [Header: Walk-in Flow]

**Walk-in online booking flow:**
1. Visit `https://{slug}.getrangeops.dev/book` (public, no auth)
2. Select date, time slot, lane type
3. System shows available slots with pricing (from the resolved offering/price)
4. Walk-in enters name, email, phone
5. Stripe Checkout session created on the org's connected account (Stripe Connect)
6. On successful payment: webhook confirms booking, status -> `confirmed`
7. Auto-create customer record with `status: 'lead'`

**Staff-created booking flow:**
1. Staff navigates to booking page in dashboard
2. Can search for existing customer or enter walk-in details
3. Selects lane type, date, time slot
4. Payment: mark as `cash` (paid in person), `free` (comp), or create Stripe charge
5. Booking created with status `confirmed`

Does this cover the flows?

**User:** Yes. For the Stripe payment on walk-in online bookings, use Stripe Checkout (redirect) not embedded. Simpler and Stripe handles PCI. And for staff bookings, they should also be able to apply an entitlement if the customer has one.

**Assistant:** [Header: Assignment]

Lane auto-assignment algorithm: when a member or walk-in selects a time slot and lane type:

1. Query all active resources of the requested `resourceType` at the selected location
2. Left join against `booking` WHERE `startTime < requestedEnd AND endTime > requestedStart AND status IN ('confirmed', 'checked_in')`
3. Filter to resources with no conflicting booking
4. Order by `resource.sortOrder` (to fill lanes in a predictable order)
5. Take the first available

If no lanes available, return "sold out" for that slot. This is a simple query, no complex optimization needed.

For concurrency: two people booking the same last lane simultaneously -- I'll cover this in edge cases. But the short answer is we use a DB transaction with a SELECT FOR UPDATE on the resource row.

**User:** Sounds right. Simple fill order is fine.

---

## Domain 4: Edge Cases & Failure Modes

**Assistant:** [Header: Edge Cases]

Key edge cases and how to handle each:

1. **Double-booking race condition**: Two users try to book the last available lane for the same slot simultaneously. Solution: wrap booking creation in a transaction. `SELECT ... FOR UPDATE` on the `resource` row to serialize concurrent bookings for the same lane. Second request gets "no lanes available."

2. **Stripe payment succeeds but webhook delayed**: Walk-in pays, but webhook hasn't fired yet. Booking stays in `pending` status. We show a "confirming payment" state. Webhook arrives and flips to `confirmed`. If webhook never arrives (rare), a background reconciliation job checks Stripe payment status after N minutes.

3. **Member has partial entitlement**: Member needs 1 unit but has 0. Offer Stripe payment fallback. If they have units but the entitlement expires between slot selection and booking confirmation, the consume call fails with `InsufficientEntitlement` -- show error, offer payment.

4. **Cancellation after payment**: Walk-in cancels. Refund via Stripe. Refund policy configurable in `bookingRules`. Options: full refund before X hours, partial refund, no refund.

5. **No-show handling**: Staff marks booking as `no_show` after the time slot passes. No automatic no-show detection in v1 -- staff-driven.

6. **Timezone handling**: All `startTime`/`endTime` stored as UTC timestamptz. Display conversion uses `location.timezone`. Slot computation respects the location's timezone for operating hours.

Does this cover your concerns, or are there edge cases you're worried about?

**User:** That covers it. On point 2, I don't want a background job for v1. If the webhook is delayed, just let it resolve naturally -- Stripe webhooks are reliable enough. If it really fails, staff can manually confirm.

**Assistant:** [Header: Booking States]

Noted -- no background reconciliation job in v1.

Booking status state machine:
```
pending -> confirmed (payment succeeded / entitlement consumed / staff created)
pending -> cancelled (user cancels before payment / payment fails)
confirmed -> checked_in (staff marks arrival)
confirmed -> cancelled (user or staff cancels)
confirmed -> no_show (staff marks after slot time)
checked_in -> completed (slot time ends or staff marks done)
```

Terminal states: `completed`, `cancelled`, `no_show`. No transitions out of these.

**User:** Perfect.

---

## Domain 5: Integration & Dependencies

**Assistant:** [Header: Integrations]

External integrations for lane booking:

1. **Stripe Connect** (already integrated): Walk-in payments go through the org's connected account. The `organizationPaymentAccount.externalAccountId` is the connected account. We create Payment Intents / Checkout Sessions on behalf of the connected account using `stripe.checkout.sessions.create({ ... }, { stripeAccount: connectedAccountId })`.

2. **Stripe Webhooks** (already integrated): Need to handle `checkout.session.completed` for walk-in bookings on connected accounts. The existing webhook handler at `/api/webhooks/stripe/route.ts` already routes connected-account events to `handleConnectEvent()`. We extend that function.

3. **Entitlement system** (already built): `consumeEntitlement()` in `src/lib/entitlements.ts` handles the member payment path. Already transactional, already has `InsufficientEntitlement` error.

4. **Email** (Resend, already integrated): Booking confirmation, cancellation, and reminder emails. Uses the existing `@workspace/email` package pattern.

No new third-party dependencies needed. Everything builds on existing integrations.

**User:** Right. One thing -- the confirmation email should include a QR code or booking reference number that staff can scan/look up at check-in.

**Assistant:** [Header: Check-in]

Good call. I'll add a `confirmationCode` field to the `booking` table -- a short, human-readable code like `BK-A3F7` (prefix + 4 alphanumeric chars, unique within the org). Generated at booking creation. Staff can search by this code.

For QR code: the confirmation email includes a QR code encoding the `confirmationCode`. Staff scans it with any QR reader (or their phone camera) which looks up the booking. No custom hardware needed in v1.

QR code generation: server-side using a library like `qrcode` -- generate as data URI, embed in the email template. Added to `@workspace/email`.

**User:** Simple and effective. Do it.

---

## Domain 6: Operational & Rollout

**Assistant:** [Header: Rollout]

Rollout considerations:

1. **Feature flag**: Add `laneBooking` to the `organizationSetting.featureFlags` JSONB. Hidden behind this flag until the org enables it. Default: `false`. The public `/book` route checks this flag -- returns 404 if disabled.

2. **Backward compatibility**: New tables only, no changes to existing tables (except extending `bookingRules` JSONB and adding a webhook handler branch). Zero risk to existing functionality.

3. **Migration**: New tables: `booking`, `booking_event`. New ID prefixes: `booking` -> `bkg`, `bookingEvent` -> `bke`. Schema-only migration, no data migration.

4. **Performance budget**: The slot availability query hits `resource` + `booking` tables. With proper indexes on `(organizationId, resourceId, startTime, endTime, status)`, this is fast even at scale. Expect sub-50ms for typical queries.

5. **Cost**: Stripe fees on walk-in payments are borne by the range operator (standard Connect model). No additional SaaS cost to RangeOps.

**User:** Good. Feature flag approach is exactly what I want. Let's also make sure the sidebar nav only shows the booking link when the feature flag is on.

**Assistant:** Noted. The sidebar's `navMain` items will conditionally include the booking link based on the feature flag. The flag is already available through `getOrgSettings()` which is loaded in the layout.

---

## Domain 7: Security & Access

**Assistant:** [Header: Security]

Security considerations:

1. **Permissions**: Add `booking` to the access control statements in `src/lib/permissions.ts`:
   - `booking: ["create", "read", "update", "cancel", "list"]`
   - Owner/admin: all permissions
   - Member: create, read own, cancel own
   - Public (walk-in): create only (via unauthenticated route)

2. **Tenant isolation**: All booking queries scoped by `organizationId`, same pattern as every other table. Composite foreign keys enforce this at DB level.

3. **Public route abuse**: The `/book` public route is an unauthenticated endpoint. Risks:
   - **Spam bookings**: Rate limit the booking creation endpoint. Stripe Checkout naturally rate-limits (requires payment completion).
   - **Slot squatting**: `pending` bookings expire after 15 minutes if payment not completed. Configurable in `bookingRules`.
   - **Enumeration**: Public availability endpoint only returns slot counts, not customer data.

4. **Payment security**: All payment flows go through Stripe Checkout (redirect). PCI compliance handled by Stripe. No card data touches our server.

5. **Entitlement abuse**: Entitlement consumption is atomic (DB transaction). Can't consume the same unit twice.

**User:** Add CAPTCHA or something for the public booking page?

**Assistant:** [Header: Bot Protect]

For v1, I recommend Stripe Checkout as the implicit bot gate -- bots can't complete payment. For non-payment bookings (not applicable here since walk-ins pay), we'd need CAPTCHA.

If spam becomes a problem, Cloudflare Turnstile is the lightweight option -- free, privacy-friendly, integrates in a few lines. But I'd defer this to v2 unless you want it now.

**User:** Defer to v2. Stripe is the gate for now.

---

## Domain 8: Testing Strategy

**Assistant:** [Header: Testing]

Testing approach following existing patterns (vitest, Effect-based tests, real Neon test DB):

1. **Unit tests** (`src/__tests__/bookings/`):
   - Booking creation (member + walk-in paths)
   - Slot availability computation
   - Lane auto-assignment algorithm
   - Status state machine transitions
   - Entitlement consumption during booking
   - Cancellation + refund logic
   - `confirmationCode` uniqueness

2. **Integration tests**:
   - Stripe Connect checkout flow (mocked Stripe)
   - Webhook handling for booking confirmation
   - Entitlement + booking transactional integrity

3. **E2e tests** (playwright, `e2e/`):
   - Public booking page flow
   - Staff booking creation flow
   - Check-in flow

4. **Test data**: Extend existing test helpers to seed resources/lanes, offerings, and booking rules. Follow the pattern in `src/__tests__/helpers/`.

**User:** Sounds thorough. Match the existing test patterns exactly.

---

## Domain 9: Code Design & Boundaries

**Assistant:** [Header: Code Design]

Module boundaries:

1. **`src/lib/db/schema/bookings.ts`** -- `booking` and `bookingEvent` tables, enums, relations
2. **`src/lib/bookings.ts`** -- Core booking logic: create, cancel, check-in, status transitions. All Effect-based. Depends on `DbService`, `StripeService`, `CurrentSession`.
3. **`src/lib/booking-availability.ts`** -- Slot computation, lane assignment. Pure query logic. Depends on `DbService` only.
4. **`src/lib/validation.ts`** -- Add booking Zod schemas (extend existing file)
5. **`src/lib/errors.ts`** -- Add booking error types (extend existing file)
6. **`src/lib/id.ts`** -- Add `booking` and `bookingEvent` prefixes
7. **`src/app/[orgSlug]/bookings/`** -- Authenticated booking pages + actions
8. **`src/app/[orgSlug]/(public)/book/`** -- Public booking page
9. **`@workspace/email`** -- Booking confirmation + cancellation email templates

Key interfaces:
- `createBooking(data)` -- orchestrates: check availability -> assign lane -> consume entitlement OR create Stripe checkout -> insert booking
- `getAvailableSlots(orgId, locationId, date, resourceTypeId)` -- returns time slots with lane counts and pricing
- `cancelBooking(bookingId)` -- handles refund logic based on `bookingRules.cancellationWindowMinutes`

Dependency direction: `bookings.ts` depends on `entitlements.ts` and `stripe.ts`, never the reverse. `booking-availability.ts` is a pure query module with no side effects.

**User:** Good separation. I like the dedicated availability module.

---

## Domain 10: Phased Build Plan

**Assistant:** [Header: Phasing]

I propose 4 phases, each delivering a working vertical slice:

**Phase 1: Schema + Staff Booking (foundation)**
- New tables: `booking`, `booking_event`
- `booking-availability.ts`: slot computation from resources + operating hours
- `bookings.ts`: create booking (staff path only), cancel, status transitions
- Staff dashboard pages: booking calendar/list, create booking form
- Feature flag gate
- Tests for all logic

**Phase 2: Member Self-Service Booking**
- Member booking page in authenticated area
- Entitlement consumption integration (uses existing `consumeEntitlement`)
- Lane auto-assignment
- Booking history view for members
- Tests

**Phase 3: Walk-in Online Booking**
- Public `/book` route with org resolution (no auth)
- Stripe Checkout integration via Connect
- Webhook handler extension for booking confirmation
- Auto-create customer as `lead`
- Pending booking expiration (15-min timeout)
- Confirmation code + QR code in email
- Tests

**Phase 4: Check-in + Operations**
- Check-in flow (staff scans QR / searches confirmation code)
- No-show marking
- Cancellation with refund (Stripe refund API)
- Booking management dashboard (today's bookings, upcoming, stats)
- Tests

Does this phasing make sense? Each phase is independently deployable.

**User:** That phasing is logical. Ship it.

---

## Interview Complete

All 10 domains resolved. Proceeding to produce the design document and then run adversarial review.
