# Lane Booking Feature -- Design Interview

## Context

The user wants to build a lane booking feature for RangeOps, a multi-tenant SaaS for shooting range management. The system already has: locations, resources (with types), customers, offerings, subscriptions, entitlements (grant/ledger/balance), and Stripe Connect for payments. The codebase uses Next.js 16, Drizzle ORM, Effect for service composition, and Zod for validation.

---

**Assistant:** I've explored the rangeops codebase. You already have a solid foundation -- resources with types, entitlements with a grant/ledger/balance system, customers, and Stripe Connect. Let me ask some questions to nail down the design.

First: **How should time slots work?** I see a couple of approaches:

1. **Fixed slots** -- the range defines discrete time blocks (e.g., 9:00-10:00, 10:00-11:00). Simpler, prevents fragmentation.
2. **Flexible duration** -- customers pick a start time and duration (e.g., 30min, 1hr, 2hr) from allowed intervals. More flexible but harder to manage gaps.

Which model fits how ranges actually operate?

**User:** Fixed slots. Most ranges run hour blocks. Some do 30-minute blocks for certain lane types, but it's always fixed increments.

---

**Assistant:** Got it -- fixed time slots, with the slot duration configurable per resource type (so pistol lanes could be 1hr blocks while rifle lanes are 30min).

Next: **How should walk-in vs. member pricing work?**

1. **Single price per slot** -- walk-ins pay it, members consume entitlements. Simple.
2. **Tiered pricing** -- different price points for walk-in, member, military/LEO, etc., modeled in the existing offering system.

**User:** Keep it simple for now. One price per lane type per time slot. Members use their entitlements. Walk-ins pay via Stripe. We can add tiered pricing later.

---

**Assistant:** Clean. Now about the **booking flow for walk-ins and Stripe payments**:

Your codebase already uses Stripe Connect (Accounts V2) where each org has a connected account. For walk-in payments, should we:

1. **Checkout Session** -- redirect to Stripe-hosted checkout page, confirm booking on webhook success. Most robust, handles 3DS/SCA automatically.
2. **Payment Intent** -- embedded payment form in the app, more seamless UX but more frontend work.

**User:** Checkout Session. We want to keep it simple and reliable. Webhook confirms the booking.

---

**Assistant:** Makes sense. Now about **booking state management**. A booking goes through several states. I'm thinking:

- `held` -- slot reserved while payment is processing (TTL ~15min for walk-ins)
- `confirmed` -- payment succeeded or entitlement consumed
- `cancelled` -- customer or staff cancelled
- `completed` -- the time slot has passed
- `no_show` -- customer didn't show up

Does that cover your operational needs? Do you need `checked_in` as a separate state?

**User:** Yes, add `checked_in`. That's important for the front desk workflow. Staff need to mark when someone actually arrives. And I'd want to track no-shows for potential policy enforcement later.

---

**Assistant:** Good call. So the states are: `held`, `confirmed`, `checked_in`, `cancelled`, `completed`, `no_show`.

**Scheduling configuration** -- how do ranges define when lanes are available?

1. **Operating hours on location** -- define open/close hours per day of week on the location, generate slots from that.
2. **Per-resource schedule** -- each lane can have its own availability schedule (for maintenance windows, special events, etc.)

**User:** Operating hours on the location level, with the ability to block out individual lanes for maintenance. Don't need full per-lane scheduling.

---

**Assistant:** Perfect. Location-level operating hours with per-resource blackout capability.

**Concurrent booking limits** -- the `resource` table has a `capacity` field (defaults to 1). Should a lane booking always consume the full capacity (one booking = one lane), or could you have shared lanes (e.g., a bay with 2 shooting positions)?

**User:** One booking per lane. The capacity field is for future use -- maybe shared bays later, but for now it's 1:1.

---

**Assistant:** Simple. One booking per lane per slot.

**How far in advance can bookings be made?** Do you need configurable advance-booking windows?

**User:** Yes. Should be configurable per org in settings. Something like "bookings open 7 days in advance" with a sensible default.

---

**Assistant:** I'll add that to the booking_rules JSONB on `organization_setting` -- it already has that column.

**Cancellation policy** -- do you need configurable cancellation windows (e.g., free cancellation up to 24 hours before)?

**User:** Yes. Configurable cutoff in hours. Walk-in cancellations should trigger Stripe refund. Member cancellations should reverse the entitlement consumption. Let's keep the refund logic simple -- full refund if within the window, no refund outside.

---

**Assistant:** Clear. Last question: **Do you need any public-facing booking page**, or is this staff-only for now?

**User:** Both. Staff booking from the dashboard for walk-ins and phone reservations, and eventually a public booking widget. But for the initial build, staff-facing is the priority. Design the data model to support both though.

---

**Assistant:** Got it. Let me summarize what I'll design:

- **Fixed time slots**, duration configurable per resource type
- **Location-level operating hours** with per-lane blackout support
- **Booking states**: held -> confirmed -> checked_in -> completed (with cancelled/no_show branches)
- **Walk-in payment**: Stripe Checkout Session on connected account, webhook confirms booking
- **Member payment**: entitlement consumption (using existing grant/ledger system)
- **One booking per lane per slot**
- **Configurable advance booking window** and **cancellation cutoff** in org settings
- **Staff-facing first**, data model supports public booking later
- **Full refund** within cancellation window, entitlement reversal for members

**User:** That's exactly right. Go ahead.
