# Digital Waivers — Architecture Design Interview

## Context

I've explored the RangeOps codebase. Key observations:
- Monorepo: Turborepo with `apps/web` (Next.js 16) and `packages/email`
- DB: Drizzle ORM on Postgres, schema in `apps/web/src/lib/db/schema/`
- Auth: Better Auth with organization plugin, role-based access (owner/admin/member)
- Patterns: Effect-TS for service layer, Zod for validation, server actions for mutations
- Multi-tenant: org-scoped via `organizationId` FK on every domain table
- IDs: nanoid with type prefixes (e.g., `cus_`, `loc_`)
- Permissions already stubbed: `waiver_template` (create/read/update/publish) and `waiver` (create/read/list)
- Customer model has `dateOfBirth`, `emergencyContactName`, `emergencyContactPhone`

---

**Assistant:** I've reviewed the codebase and I'm ready to design the digital waivers architecture. I have several questions to work through. Let's start with the data model.

**Question 1: How should waiver template content be stored?**

Waiver templates need to hold the legal text customers sign. Options:
1. **Rich text (HTML/JSON) in a `content` column** — simple, flexible, rendered on the client
2. **Structured sections (JSON array of typed blocks)** — title, paragraphs, checkboxes, signature fields as discrete typed objects
3. **Markdown in a text column** — simple storage, rendered to HTML at display time

**User:** Option 2 — structured sections. We want range managers to build templates with specific acknowledgment checkboxes that customers must individually check, plus we need to know which sections are required vs optional.

---

**Assistant:** Good choice. That gives us programmatic control over required acknowledgments.

**Question 2: Should waiver templates support versioning?**

When a manager edits a published template, should we:
1. **Overwrite in place** — simpler, but signed waivers reference content that may change
2. **Version on publish** — each publish creates a new immutable version; signed waivers reference a specific version
3. **Full audit trail** — track every draft save as a version, not just publishes

**User:** Option 2. We need signed waivers to always reference exactly what was signed, but we don't need to track every draft edit.

---

**Assistant:** Makes sense. We'll have a `waiver_template` (mutable draft) and `waiver_template_version` (immutable snapshot on publish).

**Question 3: E-signature approach — how should customers sign?**

1. **Typed name confirmation** — customer types their full name as signature (simplest, legally sufficient for most waivers)
2. **Canvas drawn signature** — customer draws signature on a touch/mouse canvas, stored as image
3. **Both options** — let the customer choose typed or drawn

**User:** Option 3 — both. Most customers on mobile will draw, but typed should be available as a fallback.

---

**Assistant:** **Question 4: How should the signing flow work for unauthenticated customers?**

At a range, many signers won't have accounts. Options:
1. **Token-based public URL** — staff generates a link/QR code, customer signs on their phone without logging in; waiver linked to customer record by email match
2. **Kiosk mode** — a dedicated tablet at the front desk running a special route, no auth required on that device
3. **Both public URL and kiosk** — support both flows

**User:** Option 3. Kiosk for walk-ins, URL/QR for pre-arrival signing (e.g., emailed before a reservation).

---

**Assistant:** **Question 5: Minor/guardian signing — what's the workflow?**

1. **Guardian signs on behalf** — single signature from the guardian, minor's info captured as metadata
2. **Co-signature** — guardian signs, then minor also signs (or acknowledges), both recorded
3. **Guardian-only with minor list** — guardian signs once and lists all minors covered under that waiver

**User:** Option 3. A parent often brings multiple kids. They should sign once and list all minors. We need each minor's name and date of birth.

---

**Assistant:** **Question 6: Waiver expiration — how should this work?**

1. **Fixed duration from signing** — e.g., 1 year from signature date, configurable per template
2. **Calendar-based expiration** — e.g., all waivers expire Dec 31 each year regardless of sign date
3. **Both, configurable per template** — manager chooses the expiration model when creating the template

**User:** Option 1. Fixed duration is simpler and what most ranges use. Default to 1 year but configurable.

---

**Assistant:** **Question 7: Where should waivers live in the navigation/UI?**

1. **Under Settings** — template management alongside other org config
2. **Top-level nav item** — "Waivers" in the sidebar, with sub-pages for templates and signed waivers
3. **Split** — template management in settings, signed waiver lookup on the customer detail page and a dedicated staff view

**User:** Option 2. Waivers are central enough to be top-level. Template management and signed waiver lookup both under the "Waivers" nav item.

---

**Assistant:** **Question 8: Should signed waivers be linked to specific locations or org-wide?**

1. **Org-wide** — sign once, valid across all locations
2. **Location-specific** — templates assigned to locations, waivers valid only at the signed location
3. **Configurable per template** — template can be scoped to specific locations or org-wide

**User:** Option 3. Some waivers are general liability (org-wide), others are location-specific (e.g., special equipment at one location).

---

**Assistant:** **Question 9: Staff waiver status view — what do front-desk staff need?**

1. **Simple lookup** — search by customer name/email, see active/expired status
2. **Check-in integration** — waiver status shown during customer check-in flow, blocking check-in if expired
3. **Dashboard with alerts** — expiring-soon list, unsigned customers, bulk actions

**User:** Option 1 for now. We don't have a check-in flow yet. Simple lookup with clear active/expired badges. We can integrate with check-in later.

---

**Assistant:** **Question 10: Should we store the signature image/data, or just a record that they signed?**

1. **Store signature data** — save the drawn image (base64/blob) or typed name, IP address, user agent, timestamp
2. **Record only** — just store that they signed, when, and which version
3. **Full forensic record** — signature data plus full snapshot of the signed content (even though we have versioned templates)

**User:** Option 1. We need the signature data for legal purposes. IP and user agent are good for non-repudiation. We don't need to duplicate the template content since we have versioning.

---

**Assistant:** That covers the key decisions. Let me summarize what I'll design:

- Structured template content (typed section blocks)
- Version-on-publish model
- Typed + drawn signature options
- Public URL + kiosk signing flows for unauthenticated users
- Guardian signs once, lists minors
- Fixed-duration expiration, configurable per template
- Top-level Waivers nav with templates + signed waivers
- Per-template location scoping (org-wide or specific locations)
- Simple staff lookup view
- Signature data stored with forensic metadata (IP, user agent, timestamp)

**User:** That's correct. Let's proceed with the design.
