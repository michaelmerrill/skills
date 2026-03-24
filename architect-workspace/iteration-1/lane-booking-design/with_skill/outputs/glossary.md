# Glossary: Lane Booking

## Why Skipped

Glossary generation was **skipped**. The skill's glossary trigger conditions were not met:

1. **No PRD exists** -- the glossary check requires "PRD introduces 3+ domain nouns not in codebase OR naming conflicts between PRD/code/UI detected." With no PRD, the first condition cannot fire.
2. **No naming conflicts detected** -- the verbal requirements use terms that map cleanly to existing codebase concepts:
   - "lane" -> `resource` (with `resourceType` for lane type)
   - "member" -> `customer` with active subscription / entitlement
   - "walk-in" -> `customer` with `status: 'lead'`
   - "time slot" -> computed from `bookingRules.operatingHours`
   - "entitlement" -> existing `entitlementGrant` / `entitlementBalance` system
   - "Stripe payment" -> existing Stripe Connect integration

3. **New domain nouns introduced by the design** (booking, bookingEvent, confirmationCode, bookerType, paymentMethod) are implementation-level names, not domain concepts requiring normalization.

If a PRD or scope doc is created later that introduces terminology, re-evaluate glossary generation at that time.
