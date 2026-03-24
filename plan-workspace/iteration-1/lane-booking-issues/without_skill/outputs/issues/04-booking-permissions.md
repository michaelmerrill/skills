# Issue 4: Booking Access Control Permissions

## Summary

Add `booking` as a resource in the Better Auth access control system with role-based permissions for owner, admin, and member roles.

## Context

The codebase uses `better-auth/plugins/access` for RBAC (see `apps/web/src/lib/permissions.ts`). The design specifies:
- Owner/Admin: `["create", "read", "update", "cancel", "check_in", "list"]`
- Member: `["create", "read", "cancel"]` (own bookings only)

## Requirements

### Update `permissions.ts`

1. Add `booking` to the `statements` object:
   ```typescript
   booking: ["create", "read", "update", "cancel", "check_in", "list"],
   ```

2. Add `booking` permissions to each role:
   - `owner`: `["create", "read", "update", "cancel", "check_in", "list"]`
   - `admin`: `["create", "read", "update", "cancel", "check_in", "list"]`
   - `member`: `["create", "read", "cancel"]`

Note: "Own bookings only" enforcement for members is handled at the service layer, not in the RBAC statements.

## Files to Modify

- **Modify**: `apps/web/src/lib/permissions.ts` -- add `booking` resource and role permissions

## Acceptance Criteria

- [ ] `booking` resource added to statements
- [ ] Owner role has full booking permissions
- [ ] Admin role has full booking permissions
- [ ] Member role has `create`, `read`, `cancel` only
- [ ] No changes to existing resource permissions

## Dependencies

None -- can be done in parallel with Issues 1-3.
