# Interview Transcript: Online Lane Reservations

> Simulated define interview on 2026-03-24
> Target codebase: rangeops (multi-tenant SaaS for shooting range operations)

---

## Codebase Exploration (Silent)

Before starting the interview, I explored the rangeops codebase with a product lens:

- **Multi-tenant SaaS** with subdomain-based routing (`{slug}.getrangeops.dev`)
- **Locations** — ranges have multiple locations, each with address, timezone, active status. Users select a location via a sidebar dropdown.
- **Resources** — the app already has a generic `resource` and `resourceType` model. Resource types are org-defined categories (e.g., "pistol lane", "rifle bay"). Resources belong to a location, have capacity and sort order, and can have a parent resource (nesting).
- **Resource types** already have a `bookingUnit` field — signals booking was anticipated.
- **Organization settings** already have a `bookingRules` JSON field — signals configurable booking rules were planned.
- **Customers** — status-based (lead, active, inactive, expired, suspended, banned), tied to an org and optionally a location. Have user accounts (optional link).
- **Offerings & subscriptions** — membership/package/pass/subscription model with Stripe integration. Offerings have prices, rules, and location assignments.
- **Entitlements** — grant/consume/ledger pattern for tracking things like "range visits" or "guest passes." Immutable grants, append-only ledger, cached balances.
- **Staff roles** — owner, admin, member. Permissions defined for resources, subscriptions, entitlements, etc.
- **No existing booking/reservation/scheduling UI or data model** — this is greenfield.
- **Stripe Connect** — ranges can accept payments via connected Stripe accounts.

---

## Domain 1: Problem & Motivation

**Assistant:** [Header: Problem] You mentioned members and walk-ins need to book lanes online. What's happening today — how do people currently reserve time at your range?

Options:
1. Phone/in-person only (Recommended)
2. Third-party booking tool
3. Mix of methods
4. Other

**User:** Phone and walk-in mostly. We take reservations over the phone and write them in a paper log or a shared spreadsheet. Walk-ins just show up and we assign them whatever's open. It's a mess on busy weekends — people show up, no lanes are free, they leave unhappy. We've also lost members who got tired of calling to reserve.

**Assistant:** [Header: Pain Point] So the core pain is: customers can't self-serve reservations, leading to lost business on busy days and frustrated members. What's the biggest cost of this problem — lost revenue from walk-aways, or member churn?

Options:
1. Lost walk-in revenue (Recommended)
2. Member churn
3. Staff time on phone
4. Other

**User:** Honestly, all three. But the member churn is what scares me most. We charge $50-100/month for memberships and some of those folks are leaving because they can't guarantee a lane when they want one. The walk-in loss is real too — we estimate maybe 15-20 people per weekend leave without shooting because we can't tell them when a lane will open up.

---

## Domain 2: Target Users & Personas

**Assistant:** [Header: Users] The app currently tracks "customers" with statuses like active, lead, inactive. Your range already has members with subscriptions and walk-in customers. Who are the distinct user types that will book lanes?

Options:
1. Members + walk-in guests (Recommended)
2. Members only at first
3. Members + guests + group/event bookers
4. Other

**User:** Members and walk-in guests for sure. We also do group events — like corporate outings and birthday parties — but those are usually handled separately. Let's keep groups out for now and focus on individual members and walk-in guests.

**Assistant:** [Header: Personas] Got it — members and walk-in guests. For members: do they typically shoot on a regular schedule (e.g., every Tuesday), or is it more ad-hoc?

Options:
1. Mostly ad-hoc, whenever they have time (Recommended)
2. Regular weekly schedule
3. Mix of both
4. Other

**User:** Mostly ad-hoc. Some regulars come the same day every week, but most just book when they feel like it. No recurring reservations needed right now.

**Assistant:** [Header: Walk-ins] For walk-in guests — would they book online before arriving, or is this more about the front desk assigning them a lane when they show up?

Options:
1. Both — online pre-booking and front-desk assignment (Recommended)
2. Online pre-booking only
3. Front desk only, just need visibility
4. Other

**User:** Both. We want guests to be able to go to our website and book ahead of time. But we also need the front desk to be able to book someone in when they walk through the door. The front desk needs to see the full picture — what's booked, what's open.

---

## Domain 3: User Stories & JTBD

**Assistant:** [Header: JTBD] Let me confirm the key jobs this feature is hired to do. A member wants to guarantee a lane for a specific time without calling. A walk-in guest wants to see availability and book before driving over. And your front-desk staff wants a live view of what's booked vs. open to manage the floor. Sound right?

Options:
1. Yes, that covers it (Recommended)
2. Missing something
3. Different priority order
4. Other

**User:** Yes, that's it. One thing to add — I also want to see a calendar or schedule view as the owner so I can understand how busy we are, when our peak times are. Not full analytics, just visibility.

**Assistant:** [Header: Stories] So we have four main stories: member self-service booking, guest pre-booking, front-desk booking/management, and owner schedule visibility. When a member books, do they care about picking a specific lane, or just a lane type (pistol, rifle)?

Options:
1. Lane type only — assign specific lane at check-in (Recommended)
2. Specific lane selection
3. Lane type, but show available specific lanes
4. Other

**User:** Lane type is what matters. Nobody cares if they're in pistol lane 3 vs pistol lane 5. We just assign them when they show up. So book by type, and we'll handle the lane assignment.

---

## Domain 4: Functional Requirements

**Assistant:** [Header: Time Slots] The app currently has resources with resource types. Your lanes would be resources grouped by type (pistol, rifle, etc.). How do your time slots work — fixed intervals (e.g., every hour on the hour), or flexible start times?

Options:
1. Fixed intervals — e.g., 1-hour blocks on the hour (Recommended)
2. Flexible start/end times
3. Fixed intervals but varying durations (1hr or 2hr)
4. Other

**User:** Fixed intervals. We do one-hour blocks typically, but some lane types we might want to do 30-minute or 2-hour blocks. Should be configurable per lane type.

**Assistant:** [Header: Duration] So the slot duration is configurable per resource type — could be 30min, 1hr, or 2hr. Can a customer book multiple consecutive slots in one reservation?

Options:
1. Yes, up to a max (Recommended)
2. Single slot only
3. No limit on consecutive slots
4. Other

**User:** Yes, but cap it. Maybe up to 3 hours max for a single booking. We don't want someone hogging a lane all day.

**Assistant:** [Header: Booking] When a member or guest books, what information do they need to provide? Members are already in the system. Walk-ins are new.

Options:
1. Guests: name, email, phone. Members: just pick and confirm (Recommended)
2. Minimal — just email for everyone
3. Full registration for guests
4. Other

**User:** Members just log in, pick their time, done. Guests need to give us name, email, and phone at minimum. We use that to create a customer record for them.

**Assistant:** [Header: Payment] Should booking require payment upfront, or is it just a reservation that gets settled at the counter?

Options:
1. Configurable — range chooses whether to require prepayment (Recommended)
2. Always prepay online
3. Never prepay, always pay at counter
4. Other

**User:** I want the option. Some ranges will want to collect a lane fee upfront to reduce no-shows. Others will just want the reservation and collect payment at the door. Our range would probably do prepay for guests and free for members (their membership covers it).

**Assistant:** [Header: Members] That connects to your entitlements system. Members with an active subscription might have lane time included. Should booking automatically check if a member's plan covers the lane fee, or always free for active members regardless?

Options:
1. Always free for active members — membership covers lane access (Recommended)
2. Check entitlement balance for "lane visits" and consume one
3. Depends on membership tier
4. Other

**User:** For now, if you're an active member, lane booking is free. Period. No need to track individual visits against a balance — the membership covers it. We might get more granular later with tier-based limits, but not now.

**Assistant:** [Header: Confirm] After booking, what confirmation does the user get?

Options:
1. Email confirmation with booking details (Recommended)
2. On-screen confirmation only
3. Email + SMS
4. Other

**User:** Email confirmation for sure. SMS would be nice eventually but email is fine for v1.

**Assistant:** [Header: Cancel] Can customers cancel or modify their bookings? What's the cancellation policy?

Options:
1. Cancel anytime, configurable cutoff for no-show penalty (Recommended)
2. Cancel up to X hours before
3. No cancellation allowed
4. Other

**User:** Customers can cancel. We'd want a configurable cutoff — like, if you cancel less than 2 hours before your slot, it counts as a no-show. For prepaid guests, maybe they lose the fee or get a partial refund. For members, we'd just want to track no-shows. No penalty yet, but we want the data.

**Assistant:** [Header: Capacity] The app's resources already have a `capacity` field. If you have 6 pistol lanes and 3 are booked for 2pm, the system shows 3 remaining for that slot. Does each booking take one lane, or can a booking cover multiple lanes (e.g., I'm bringing a friend)?

Options:
1. One lane per booking — friend books separately (Recommended)
2. Book multiple lanes in one reservation
3. One lane, but specify number of shooters
4. Other

**User:** One lane per booking. If you're bringing a buddy, they book their own lane. Keeps it simple. We do need to know how many shooters per lane for safety reasons, though — usually 1 or 2 per lane max.

**Assistant:** [Header: Shooters] So each booking captures shooter count (1 or 2) for safety. Does the shooter count affect pricing or just capacity tracking?

Options:
1. Just safety/tracking — no price difference (Recommended)
2. Price per shooter
3. Other

**User:** Just tracking. No price difference whether it's one or two people sharing a lane.

---

## Domain 5: Non-Functional Requirements

**Assistant:** [Header: Timing] How far in advance should customers be able to book, and how close to the slot time?

Options:
1. Configurable advance window, e.g., 7 days ahead, up to 1 hour before (Recommended)
2. Fixed — 14 days ahead, 2 hours before
3. Unlimited advance booking
4. Other

**User:** Configurable, definitely. We'd probably do 14 days out, can't book less than 1 hour before. But other ranges might want different windows.

**Assistant:** [Header: Device] Your customers booking online — are they mostly on phones or desktop?

Options:
1. Mostly mobile (Recommended)
2. Mostly desktop
3. Even split
4. Other

**User:** Definitely mobile. Our members are usually checking availability on their phone during lunch or in the evening. Needs to work great on a phone.

**Assistant:** [Header: Access] Any accessibility or compliance requirements beyond standard web accessibility?

Options:
1. Standard WCAG 2.1 AA is sufficient (Recommended)
2. Specific ADA requirements
3. Not a priority right now
4. Other

**User:** Standard accessibility is fine. Nothing special beyond that.

---

## Domain 6: Success Metrics & KPIs

**Assistant:** [Header: Success] How will you know this feature is working? What does success look like at 30, 60, 90 days?

Options:
1. Booking adoption rate + no-show reduction (Recommended)
2. Revenue from lane fees
3. Member retention improvement
4. Other

**User:** A few things: I want to see what percentage of our lane time is being booked online vs. walk-in. If we get to 40-50% online bookings in the first 90 days, that's great. I also want to see no-show rates — if prepayment reduces no-shows, that proves the model. And longer term, I want to see if member retention ticks up because they can actually get a lane when they want one.

**Assistant:** [Header: Metrics] Let me nail down specifics. Is "utilization rate" — percentage of available lane-hours that are booked — a metric you'd track?

Options:
1. Yes, that's a key metric (Recommended)
2. Nice to have but not critical
3. Not important
4. Other

**User:** Yes, absolutely. Right now I have no idea what our actual utilization is. Even just having visibility into that would be huge.

---

## Domain 7: Scope Definition

**Assistant:** [Header: Scope In] Let me confirm what's in scope for v1: customer-facing booking by lane type for a time slot, front-desk booking/management view, email confirmations, configurable slot durations per lane type, configurable booking windows, member free-booking, guest prepayment option, cancellation with configurable cutoff, shooter count per booking, and schedule visibility for operators. Sound complete?

Options:
1. Yes, that covers v1 (Recommended)
2. Missing something
3. Too much for v1
4. Other

**User:** That's right. Let's do it.

**Assistant:** [Header: Scope Out] And explicitly out of scope: recurring reservations, group/event bookings, SMS notifications, tier-based entitlement consumption for lane access, no-show penalties beyond tracking, and specific lane assignment by customer. Correct?

Options:
1. Yes, defer all of those (Recommended)
2. I want one of those back in
3. Other

**User:** Correct. All deferred. Recurring reservations and group bookings are the most likely to come back for v2.

---

## Domain 8: Dependencies & Constraints

**Assistant:** [Header: Depends] The app already has Stripe Connect for payment processing and an email system (Resend). Booking payments for guests would flow through the range's connected Stripe account. Are there any business constraints — pricing decisions not yet made, legal requirements for booking terms, or timing pressures?

Options:
1. No major blockers — pricing and Stripe are ready (Recommended)
2. Pricing not decided yet
3. Legal review needed for booking terms
4. Other

**User:** Pricing is up to each range — they set their own lane fees. That's already how offerings work. The only constraint is we need this before summer. Our busy season starts in May and I really want online booking live before Memorial Day weekend.

**Assistant:** [Header: Timeline] So the constraint is: live before Memorial Day (late May 2026). That's about 2 months. Any other dependencies — do you need a waiver signed before someone can book, or is that separate?

Options:
1. Waivers are separate — not required for booking (Recommended)
2. Waiver required before booking
3. Not sure yet
4. Other

**User:** Waivers are a separate thing. We'll deal with that flow later. You can book without a waiver — we handle waivers at check-in.

---

## Domain 9: Risks & Open Questions

**Assistant:** [Header: Risks] A few product risks I see: (1) If the booking window is too generous, regulars might block out all the prime slots weeks ahead, shutting out walk-ins. (2) Without no-show penalties, free member bookings could lead to phantom reservations. (3) Guest conversion — if the guest booking flow has too much friction, they'll just call instead. What concerns you most?

Options:
1. Phantom reservations from members (Recommended)
2. Regulars hogging slots
3. Guest booking friction
4. Other

**User:** The phantom reservation thing. Members booking and not showing up. That's why I want to track no-shows even if we don't penalize yet. If it becomes a problem, we'll add penalties in v2. The hogging issue — I think the 14-day window and 3-hour max handles that. And for guest friction, keep the form short and I think we're fine.

**Assistant:** [Header: Open Qs] One open question: when the range is closed (holidays, maintenance), how should that work? Should operators be able to block out time so no one can book?

Options:
1. Yes, operators block out time manually (Recommended)
2. Set recurring operating hours, auto-block outside them
3. Both — operating hours + manual overrides
4. Other

**User:** Both. We have regular hours — open 9am to 9pm most days — and then we need to be able to block off specific times for events, maintenance, whatever. So regular operating hours plus manual overrides.

**Assistant:** [Header: Hours] So the system needs operating hours per location (which might vary by day of week) plus the ability to create manual blocks. Bookable slots are only generated within operating hours minus any manual blocks. That's the last domain — I think we have enough to draft the PRD.

**User:** Sounds good. Let's see it.
