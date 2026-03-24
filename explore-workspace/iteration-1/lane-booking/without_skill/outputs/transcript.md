# Lane Booking Feature - Discovery Transcript

## Context
Product: RangeOps (multi-tenant SaaS for shooting range management)
Stakeholder: Range operator / business owner
Date: 2026-03-24

---

**Assistant:** I've looked through the RangeOps codebase. You already have a solid foundation: locations, resource types (which could represent lane types like pistol/rifle), individual resources (the lanes themselves), a customer model, memberships/subscriptions with Stripe billing, and an entitlements system. Before I scope the lane reservation feature, I need to understand a few things about how your ranges actually operate.

First question: what does a typical booking look like today? Are customers calling ahead, or is it all walk-in-based with a clipboard or whiteboard at the front desk?

**User:** Right now it's mostly walk-ins. The RSO at the front desk checks which lanes are open and assigns one. We have a paper logbook. Some of our busier locations get a line out the door on weekends, which is the main reason we want online reservations -- to smooth out demand and reduce wait times.

**Assistant:** That makes sense. So the immediate pain is weekend congestion and no way for customers to plan ahead. A couple of follow-ups:

1. How long is a typical lane session? Is it a fixed block (e.g., always 1 hour) or does it vary?
2. Do you want to keep supporting walk-ins alongside online reservations, or would you eventually move to reservation-only?

**User:** Sessions are typically 1 hour, but we'd like to offer 30-minute and 2-hour options too. And we definitely need to keep walk-ins. A lot of our regulars just show up. I'd say the split should be something like 70% reservable online, 30% held back for walk-ins -- but that ratio should be configurable per location.

**Assistant:** Got it -- configurable time slots (30 min, 1 hr, 2 hr) and a reservable-vs-walk-in capacity split per location. Now about your lane types:

3. How many distinct lane types do you typically have at a single location, and does pricing differ between them?

**User:** Most of our locations have two types: pistol lanes (25 yards) and rifle lanes (100 yards). One location also has a VIP bay. Pricing is different for each -- rifle lanes are more expensive, VIP is premium. Members get discounted rates or included sessions depending on their plan.

**Assistant:** That maps well to the existing `resourceType` and `resource` tables -- pistol, rifle, VIP would be resource types, and individual lanes would be resources under them.

4. For member benefits specifically: should members get a certain number of free sessions per month (drawn from entitlements), a flat discount percentage, or both?

**User:** Both, ideally. Our premium members get 4 included sessions per month, plus 20% off additional bookings. Standard members just get 10% off. Walk-in non-members pay full price. We'd want the system to automatically check the member's entitlement balance when they book.

**Assistant:** The entitlement grant/ledger system you already have can handle the "included sessions" piece -- each month's subscription renewal would grant 4 units of a `lane_session` entitlement type, consumed at booking time. The percentage discount could be driven by offering rules.

5. What about cancellations and no-shows? Do you have a policy in mind?

**User:** We'd want a 2-hour cancellation window -- cancel before that, full refund; after that, no refund. For no-shows, we'd want to charge and maybe flag the customer. Repeat no-shows should be flaggable for the RSO to review. We also need the RSO to be able to cancel or modify bookings from the staff side.

**Assistant:** Clear. Two-hour cancellation cutoff, no-show tracking with staff alerts, and full staff-side CRUD on bookings.

6. For the online booking experience: who are the users? Do your customers already have accounts in the system, or would walk-ins (non-members) need to book without an account?

**User:** Members would log in. But we also want walk-ins to be able to book online -- ideally without creating a full account. Just name, email, phone, and a credit card to hold the reservation. If they become a member later, we'd want to link those past bookings.

**Assistant:** So guest checkout for non-members, with optional account linking later. That maps to your existing customer model -- you'd create a customer record with status "lead" for guest bookings.

7. How should payments work? Pay at time of booking online, or just hold a card and charge at check-in?

**User:** For online reservations, charge at time of booking. For walk-ins that the RSO books at the desk, we'd handle payment through our existing POS -- the system just needs to record the booking. We use Stripe Connect, so payments should go through the range's connected account.

**Assistant:** Your Stripe Connect integration is already in place. Online bookings would use Stripe Checkout or Payment Intents on the connected account. Staff-created bookings would be recorded without a Stripe charge.

8. What about operating hours and blocked-out times? Can ranges close certain lanes for maintenance, or block holidays?

**User:** Yes, we need that. Each location has operating hours that can vary by day of week. And we need to be able to block off specific lanes or entire locations for maintenance, private events, or holidays. The RSO should be able to do this from the admin panel.

**Assistant:** Last question:

9. How far in advance should customers be able to book, and do you have any peak-pricing ambitions (charging more for weekend slots, etc.)?

**User:** Let's start with a 30-day advance booking window. Peak pricing is interesting but not for v1 -- keep it simple with flat per-slot pricing per lane type. We can add dynamic pricing later.

**Assistant:** That's a clean scope for v1. Let me summarize what I've gathered and put together a formal scoping document.
