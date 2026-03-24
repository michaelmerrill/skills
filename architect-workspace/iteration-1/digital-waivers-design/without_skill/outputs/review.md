# Digital Waivers Design — Quality Review

## Overall Assessment: Ready for implementation with minor gaps noted below.

## Strengths

1. **Follows existing patterns exactly.** Schema uses the same compound unique constraint pattern (`id + organizationId`), same index naming conventions, same FK patterns as `resources.ts`, `offerings.ts`, etc. Effect-TS service layer, Zod validation, server actions — all match existing code.

2. **Version-on-publish is the right call.** Signed waivers reference an immutable version, so legal integrity is maintained even as templates evolve. The `currentVersionId` on the template makes it easy to get the latest published version.

3. **Multi-tenant isolation is solid.** Every table has `organizationId`, every query scopes by it, FKs use compound keys to prevent cross-tenant references. Consistent with the rest of the schema.

4. **Signing token design handles the public URL flow well.** Tokens are one-use, have expiry, and link back to the signed waiver. The `/sign/[token]` route doesn't need auth.

5. **Permissions already stubbed.** No permission model changes needed — the existing `waiver_template` and `waiver` resource definitions in `permissions.ts` cover all operations.

## Gaps / Issues

### 1. Signature data storage (Medium)
Base64 image data in a `text` column could be large (50-200KB per drawn signature). For a high-volume range this adds up. Consider:
- Storing drawn signatures in blob storage (S3/R2) with a URL reference
- Or accept the Postgres storage cost since waiver volumes are moderate (hundreds/month, not millions)

**Recommendation:** Acceptable for launch. Revisit if storage becomes a concern.

### 2. Kiosk security (Medium)
The kiosk page at `/{orgSlug}/waivers/kiosk` is described but the auth model isn't fully specified. If it requires an authenticated staff session, the tablet needs to stay logged in. If it's unauthenticated, it needs some form of kiosk token or device registration to prevent abuse.

**Recommendation:** Add a kiosk access token (similar to signing token but long-lived, per-device) that the range manager generates. The kiosk page validates this token instead of a user session.

### 3. Email notification on waiver completion (Low)
The design doesn't include sending a confirmation email to the signer with a copy/link to their signed waiver. Many range customers expect this.

**Recommendation:** Add a `sendWaiverConfirmation` step in `submitSignedWaiver`. Use the existing Resend/email infrastructure. Low effort.

### 4. Drawn signature size limits (Low)
No max size specified for `signatureData`. A maliciously large base64 string could cause issues.

**Recommendation:** Add a `z.string().max(500_000)` constraint on `signatureData` in the Zod schema. That covers any reasonable drawn signature.

### 5. Customer auto-creation not decided (Low)
The design says "configurable, default to not auto-creating" a customer record when an unknown email signs. This should be a firm decision before implementation.

**Recommendation:** Default to auto-creating a `lead` customer. Ranges want to capture walk-in contact info. This matches the existing customer status flow (lead -> active).

### 6. No rate limiting on public signing endpoint (Medium)
The `/sign/[token]` route and kiosk endpoint are public. No rate limiting is mentioned beyond the global Better Auth rate limiter (which won't apply to these non-auth routes).

**Recommendation:** Add rate limiting to the public signing API route. The token is one-use which helps, but the form submission endpoint should still be rate-limited.

### 7. Template section builder complexity (Low)
The template editor with drag-and-drop sections is the most complex UI component. No specific library choice is mentioned.

**Recommendation:** Use `@dnd-kit/core` for drag-and-drop (lightweight, accessible, works with React server components pattern). Or simpler: up/down arrow buttons to reorder, skip drag-and-drop for v1.

### 8. Missing: waiver_template_location ID prefix
The schema adds `waiverTemplateLocation` as a table but no ID prefix is listed for it in the new prefixes section.

**Recommendation:** Add `waiverTemplateLocation: "wtk"` to the prefixes.

## Architecture Consistency Check

| Aspect | Status | Notes |
|--------|--------|-------|
| Schema conventions | Pass | Compound FKs, naming, indexes all match |
| ID prefix system | Pass (with gap #8) | New prefixes follow pattern |
| Effect-TS service pattern | Pass | Same `DbService`/`CurrentSession` dependency pattern |
| Zod validation | Pass | Same schema style as existing |
| Server action pattern | Pass | Same `ActionResult` / `Effect.match` pattern |
| Error types | Pass | Tagged errors, same pattern |
| File organization | Pass | Schema in schema dir, service in lib, routes in app |
| Multi-tenancy | Pass | organizationId on everything |
| Permissions | Pass | Already defined, no changes needed |
| Testing approach | Pass | Vitest unit + Playwright E2E matches existing |

## Verdict

The design is implementable. The gaps identified are all addressable during implementation and none require rethinking the architecture. The biggest risk is the kiosk auth model (gap #2), which should be decided before building that flow.

Recommended implementation order:
1. Schema + migrations
2. Service layer + validation
3. Template CRUD UI
4. Signing form (shared component)
5. Public URL signing flow
6. Staff lookup view
7. Kiosk mode (can be deferred to v1.1)
