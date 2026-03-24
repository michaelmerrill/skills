# Adversarial Review: Digital Waivers Design

## Analysis Summary

Read the full design spec. 16 decisions, 7 behavior specs, 12 edge cases, 3-phase build plan covering all 31 FRs and 7 user stories. Verified against codebase, PRD, and scope doc.

### PRD Alignment

- All 31 functional requirements (FR-1 through FR-31) mapped to behavior specs and/or build phases.
- All 7 user stories have explicit behavior specs with step-by-step implementation.
- All 6 non-functional requirements addressed: NFR-1 (mobile-first — page is RSC, responsive by default), NFR-2 (WCAG — noted but not deeply specified), NFR-3 (3s load — lightweight RSC + single query), NFR-4 (indefinite retention — append-only, no deletion), NFR-5 (tenant-scoped — all queries scoped by organizationId), NFR-6 (no-JS degradation — server action form submission).
- No scope creep detected. Out-of-scope items remain out of scope.

### Scope Alignment

- Nothing from "likely out for v1" creeps in.
- All "likely in for v1" items are covered.
- "Needs investigation" item (data retention) resolved: indefinite retention, append-only.

### Codebase Verification

- `permissions.ts` stubs confirmed: `waiver_template: ["create", "read", "update", "publish"]` and `waiver: ["create", "read", "list"]` match the design.
- Admin lacks `"publish"` on `waiver_template` — confirmed as intentional.
- `proxy.ts` rewrite confirmed: subdomain routing already handles `/{orgSlug}/*`.
- `organizationSetting.featureFlags` confirmed: JSONB field exists, used as designed.
- `customer` table confirmed: all needed fields (firstName, lastName, email, phone, dateOfBirth, status) exist.
- `@workspace/email` package confirmed: pattern for adding new templates is clear.
- Effect service pattern confirmed: `customers.ts` uses identical Effect.gen + DbService + tagged errors.
- Test helpers confirmed: `createTestSession`, `addMember`, `resetTestState` all exist and match test plan.

---

### Verdict: Ready

**Strengths**
- Fully additive design — no changes to existing tables or APIs. Zero regression risk.
- Leverages every existing pattern (Effect services, server actions, proxy rewrite, tagged errors, prefixed IDs, feature flags) without deviation.
- Frozen template snapshot is the right call for legal compliance — avoids a class of audit problems.
- Derived waiver status (no stored state, no cron) is simpler and more correct than a materialized approach.

**Issues** (severity-ordered)
1. **HTML Sanitization (Security)**: The design mentions sanitizing template body HTML on render but doesn't specify where or how. Tiptap output is semi-trusted (entered by org admins, not end users), but stored HTML rendered to the public page is still an XSS vector. **What to do**: Add DOMPurify (or equivalent) sanitization in the signing page RSC when rendering `templateSnapshot`. Add to Phase 2 acceptance criteria.

2. **WCAG AA Compliance (NFR-2)**: The design acknowledges NFR-2 but doesn't specify how it will be verified. The signing page is mobile-first and public-facing — accessibility matters. **What to do**: Add "passes axe-core audit with zero critical violations" to Phase 2 acceptance criteria. Not a design change, just a testing checkpoint.

3. **Minor Customer Matching (Data)**: For minor waivers, the design says "query by firstName + lastName + dateOfBirth + organizationId" — this is fragile (name spelling variations, no email for minors). Acceptable for v1 but worth noting. **What to do**: Accept for v1. Document as a known limitation. Consider adding a `guardianCustomerId` -> minor link for future dedup tooling.

4. **`resetTestState` Table List (Testing)**: The test helper `db.ts` has a hardcoded table list for TRUNCATE. New tables (`waiver_template`, `waiver`) must be added to this list. **What to do**: Add both tables to the truncation list in Phase 1. Note: they must appear before `customer` in dependency order.

**Risks**
- Tiptap dependency adds ~50KB to the admin bundle. Low risk — only loaded in settings, not the public page.
- The public signing page is the first unauthenticated page in the platform. Any security pattern established here sets precedent for future public pages. The rate-limiting + server-action approach is sound, but should be documented as the canonical pattern.

**Recommended next step** — Spec is ready. Run `/plan` to decompose into implementation issues.
