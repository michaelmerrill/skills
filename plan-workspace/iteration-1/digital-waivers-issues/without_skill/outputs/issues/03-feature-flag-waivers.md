# Issue 3: Feature Flag — waivers

## Summary

Add the `waivers` boolean to `organizationSetting.featureFlags` and create a helper to check it. This flag gates the entire feature: settings tab visibility, public page availability, and customer list badges.

## Context

Feature flags are stored in `organizationSetting.featureFlags` as a JSONB column (`apps/web/src/lib/db/schema/organization-settings.ts`). The design specifies `featureFlags.waivers: boolean` for controlled rollout.

## Acceptance Criteria

- [ ] Type definition for `featureFlags` includes `waivers?: boolean` (update the `$type<>` generic or add a typed helper)
- [ ] Helper function `isWaiversEnabled(featureFlags: Record<string, unknown>): boolean` exported from an appropriate location (e.g., `lib/waivers.ts` or a shared utilities file)
- [ ] Default value for new orgs: `waivers: false` (waivers disabled by default)
- [ ] The flag can be toggled per-org (no UI needed yet — can be set directly in DB for beta testing)

## Technical Notes

- The `featureFlags` column is typed as `Record<string, unknown>`. Consider adding a stricter type or at least a runtime check: `flags?.waivers === true`.
- This is a lightweight issue — mainly establishing the convention so other issues can depend on it.

## Dependencies

None.
