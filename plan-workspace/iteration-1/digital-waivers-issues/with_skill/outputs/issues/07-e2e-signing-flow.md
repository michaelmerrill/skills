# E2e Test: Waiver Signing Flow

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 7 of 7
> Type: AFK

## Blocked by

- [04-public-signing-page.md](./04-public-signing-page.md) -- needs the public signing page and signing action deployed.

## What to build

Create a Playwright e2e test that exercises the full public waiver signing flow: visit the public page, verify org branding renders, verify "not available" message when no template, complete the adult signing flow (fill form, submit, see confirmation), and test the guardian/minor toggle. This validates the end-to-end path from proxy rewrite through RSC rendering through server action execution.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/e2e/waiver-signing.spec.ts` | Playwright e2e test for the public signing page | Follow `apps/web/e2e/subdomain-routing.spec.ts` for test structure, base URL config, and subdomain simulation |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/playwright.config.ts` | May need to add a test project or base URL configuration for subdomain testing, if not already present. Verify the existing config supports subdomain-based tests |

## Context

### Patterns to follow
- `apps/web/e2e/subdomain-routing.spec.ts`: existing e2e test that validates proxy rewrite behavior for subdomains. Shows how to simulate subdomain requests in Playwright.
- `apps/web/playwright.config.ts`: Playwright configuration -- base URL, browser settings, timeout config.

### Key types
```typescript
// Playwright test structure
import { test, expect } from "@playwright/test";

test.describe("waiver signing", () => {
  test("shows not available when no template", async ({ page }) => { ... });
  test("adult signing flow", async ({ page }) => { ... });
  test("guardian/minor signing flow", async ({ page }) => { ... });
});
```

### Wiring notes
- The e2e test needs a test org with a published waiver template. Either seed this in a test setup fixture or use the API to create it before the test runs.
- Subdomain simulation: use Playwright's `page.goto()` with a URL like `http://{slug}.localhost:3000/waiver` or configure the base URL to point to the subdomain.
- The form submission should work as a standard form POST (progressive enhancement) -- test with JavaScript both enabled and disabled if feasible.
- Assertions: verify page title/heading contains org name, waiver text is visible, form fields are present, confirmation screen renders after submit.

## Acceptance criteria

- [ ] Test: public page renders org branding (name visible)
- [ ] Test: "not available" message when feature flag disabled or no published template
- [ ] Test: adult signing flow -- fill all required fields, submit, see confirmation with name + dates
- [ ] Test: guardian/minor toggle shows additional fields
- [ ] Test: age validation -- under-18 signer sees error
- [ ] All e2e tests pass in CI
- [ ] `bun run lint` passes

## Verification

```bash
cd apps/web
bun run lint
bunx playwright test e2e/waiver-signing.spec.ts
```

## Notes

- E2e tests require a running dev server with a test database. The existing `playwright.config.ts` should handle server startup.
- If subdomain routing in e2e is complex (depends on DNS/hosts config), an alternative is to test the rewritten path directly: `page.goto("http://localhost:3000/{slug}/waiver")`. This bypasses proxy.ts but still tests the page and action.
- Keep the test focused on the critical path. Don't test every edge case -- that's what the unit tests in issues #4 and #2 cover.
