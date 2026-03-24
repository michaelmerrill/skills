# Scope: Digital Waivers

> Generated from explore scoping interview on 2026-03-24

## Problem Statement

Every shooting range customer must sign a liability waiver before using the range. Today this is done on paper, which creates two problems: (1) slow, friction-heavy check-in experience for customers and staff, and (2) unreliable record-keeping that makes it difficult to locate signed waivers, prove compliance, and defend against liability claims. Without a digital waiver system, RangeOps cannot support the most fundamental daily workflow at a range, making the platform incomplete for operational use.

## Stakeholders

- **Users**: All range customers (members, walk-ins, guests, minors with guardians). Front-desk staff who verify waiver status at check-in. Managers who create and maintain waiver templates.
- **Business**: Launch blocker for RangeOps. Table stakes for selling to range operators -- conversations end if waivers aren't supported. Included in the base product, not a premium upsell.
- **Internal**: First customer-facing (non-admin) page in the platform. Sets the pattern for future public-facing tenant pages.

## Feasibility Assessment

- **Technical feasibility**: Fully feasible with the current stack. The permissions layer already defines `waiver_template` and `waiver` resources with role-based access for owner, admin, and member roles. The customer model has email and phone fields for delivering waiver links. Subdomain-based tenant routing via `proxy.ts` supports public-facing pages per tenant. Resend email integration is operational. Drizzle ORM schema conventions (multi-tenant with `organizationId`, immutable append-only patterns) are well-suited for waiver audit trails. Organization settings include `featureFlags` for gating rollout. No new major dependencies required.
- **Prior work**: Permission stubs in `permissions.ts` for `waiver_template` and `waiver`. README lists waivers as a platform capability. No schema tables, routes, or UI exist.

## High-Level Scope

**Likely in for v1:**
- Waiver template management for operators (create, edit, publish)
- Customer-facing waiver signing page (phone-first, mobile-optimized)
- Native e-signature capture (typed name + consent affirmation + audit metadata: timestamp, IP, device, frozen waiver text)
- Waiver status visible to staff in the customer view (signed/unsigned/expired)
- Waiver expiration tracking (e.g., annual renewal required)
- Minor/guardian signing (one adult signs for one or more minors on a single form)
- Public tenant-scoped URL for signing (e.g., `{slug}.getrangeops.com/waiver`)

**Likely out for v1:**
- Automated renewal/expiration reminder emails -- can be added after v1 once the core is stable
- Kiosk/shared-tablet mode -- phone-first for v1; kiosk is a fast follow
- Payment collection during waiver signing -- separate concern, not part of waiver flow
- Waiver analytics or reporting dashboards -- no operator demand yet
- Third-party e-signature integration (DocuSign, HelloSign) -- unnecessary for range waivers; native approach is industry standard
- Multi-version template diffing or migration -- template management keeps it simple for v1

**Needs investigation:**
- Data retention policy for signed waivers -- ranges need long-term retention for liability, but privacy implications need clarification during requirements

## Key Risks & Assumptions

- **Risk**: Native e-signature may not meet legal requirements in all US jurisdictions. *Likelihood: L. Impact: Would need to add a third-party e-signature service or additional capture mechanisms. Mitigation: legal review before production launch.*
- **Risk**: First customer-facing public page in the platform. No existing pattern for unauthenticated, mobile-optimized pages under tenant subdomains. *Likelihood: L. Impact: May take longer than estimated as the pattern is established. This becomes reusable infrastructure for future public pages.*
- **Assumption**: Range operators will adopt digital waivers readily over paper. *If wrong: Low adoption would undermine the feature's value, though operator feedback strongly supports this.*
- **Assumption**: A typed-name + consent checkbox approach is sufficient for range liability waivers (no drawn/finger signature needed). *If wrong: Would need to add a signature pad component, adding minor complexity.*
- **Assumption**: Waiver content does not vary by location within the same organization for v1. *If wrong: Template model may need per-location variants, increasing scope.*

## Recommendation

**Verdict**: Go

This is a launch blocker and table-stakes feature with clear operator demand. The technical foundation is already partially in place (permissions stubbed, customer model ready, tenant routing operational). The scope is well-defined and bounded. Estimated at 2-3 weeks of focused work. No major technical risks -- the primary uncertainty is legal, which is low-likelihood and can be mitigated with a review. Proceed to `/define` for detailed requirements.

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | 2026-03-24 | Go | Launch blocker. Permissions pre-stubbed. First public-facing page. Native e-sign. ~2-3 weeks. Minor/guardian signing in v1. |
