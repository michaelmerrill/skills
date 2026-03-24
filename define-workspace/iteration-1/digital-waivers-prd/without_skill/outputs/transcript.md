# Digital Waivers PRD Interview Transcript

## Context

The interviewer (Assistant) is gathering requirements from a range operator (User) to write a PRD for the Digital Waivers feature. The scope has already been approved: template management, mobile signing page, e-signature capture, status tracking, expiration, and minor/guardian signing. Out of scope: reminder emails, kiosk mode, payment integration, analytics dashboards, and third-party e-sign providers.

---

**Assistant:** We've got the scope locked down for digital waivers. I need to dig into a few specifics before writing the PRD. Let's start with template management. How many different waiver templates does a typical range need? Are we talking one general liability waiver, or do you need different waivers for different activities (pistol range, rifle range, classes, etc.)?

**User:** Most ranges have one main liability waiver, but some of our larger operators have separate ones for classes, events, and youth programs. I'd say support for multiple templates per organization is a must. Maybe 3-5 templates for a typical multi-service range.

**Assistant:** Got it. And who should be able to create and edit these templates -- just owners, or admins too? I see the permissions system already has `waiver_template` with create/read/update/publish actions and `waiver` with create/read/list.

**User:** Owners and admins should both be able to create and edit drafts, but only owners should be able to publish a template -- that makes it live and available for signing. We don't want a front-desk admin accidentally pushing out a half-done waiver.

**Assistant:** Makes sense. On the template content itself -- are operators writing these from scratch in a rich text editor, or are they typically pasting in legal text they got from their lawyer? Do they need formatting like bold, headers, bullet lists?

**User:** They're pasting in legal text 90% of the time. Basic formatting is nice -- headers, bold, numbered lists -- but we don't need a full word processor. A simple block editor or markdown-style input would be fine. The key thing is it needs to render cleanly on a phone screen.

**Assistant:** For the signing flow, walk me through the ideal customer experience. Where does a customer encounter the waiver -- do they get a link texted to them, do they scan a QR code at the front desk, or does the front-desk staff pull it up?

**User:** All of the above ideally, but if I had to pick the MVP path: the front-desk staff looks up the customer, sees they haven't signed the current waiver, and either sends them a link via text or pulls up the signing page on a tablet they hand to the customer. A shareable link that works without logging in is critical -- customers shouldn't need an account to sign a waiver.

**Assistant:** So the signing page is a public URL -- no auth required. It's tied to the organization and the specific waiver template. Does the customer need to provide any info on that page, or do we pre-fill from the customer record?

**User:** If the link was generated for a specific customer (e.g., staff sent it), pre-fill name and email from the customer record. If it's a generic link (like a QR code in the lobby), the customer fills in their name, email, and date of birth. Either way, they read the waiver, check an agreement box, draw their signature, and submit.

**Assistant:** On the e-signature capture -- are we talking a drawn signature on a touch screen canvas, or is typed-name-as-signature acceptable? Any legal requirements you're aware of?

**User:** Drawn signature on a canvas is the standard our operators expect. Typed name would be a step down from what they do on paper today. We should capture the drawn signature as an image and store it. For legal purposes, we also need to record the IP address, timestamp, and user agent -- that's what the legal folks have told us makes it defensible.

**Assistant:** Let's talk about minors. What's the age cutoff, and how does the guardian flow work?

**User:** Under 18 requires a parent or guardian signature. The guardian fills out their own info (name, relationship, contact) plus the minor's info, then signs on behalf of the minor. One guardian should be able to sign for multiple minors in one session -- like a parent bringing three kids to a birthday party. The waiver record should link the guardian to each minor.

**Assistant:** For the age cutoff, is 18 universal or does it vary by state/location? Should this be configurable per organization?

**User:** Make it configurable per organization with a default of 18. Some states have different rules for certain activities, and our operators know their local laws.

**Assistant:** Now status tracking and expiration. What statuses does a waiver go through, and how does expiration work?

**User:** A signed waiver should have a clear status: signed, expired, or voided (if an admin manually invalidates it). Expiration should be configurable per template -- most ranges do annual waivers, so 365 days from signing is the default. Some do lifetime waivers (no expiration). When a customer's waiver expires, front-desk staff should see that clearly when they look up the customer -- like a badge or status indicator.

**Assistant:** Should expired waivers block anything in the system, or is it just informational at this point?

**User:** Informational for now. In the future we'll want to block check-in if the waiver is expired, but that's tied to access control features we haven't built yet. For this release, it's a visual indicator on the customer profile and in the customer list.

**Assistant:** How should the waiver relate to locations? Is a waiver signed at one location valid across all locations for that organization, or is it per-location?

**User:** Organization-wide. If you sign the general liability waiver at our downtown location, it's valid at our north-side location too. The template is org-level, the signed waiver is org-level.

**Assistant:** On template versioning -- if an operator updates their waiver text, what happens to existing signed waivers? Do customers need to re-sign?

**User:** Existing signed waivers should remain valid under the version they signed. If a template is updated and republished, it becomes a new version. Operators should be able to decide whether to require re-signing -- maybe a flag on the template update like "this is a material change, require re-sign" versus "minor typo fix, don't invalidate existing signatures."

**Assistant:** Last question -- storage and retrieval. Should operators be able to download or print a signed waiver? What does the completed waiver record look like?

**User:** Yes, they need to be able to view and download a PDF of the signed waiver -- the full text plus the signature image, signer info, and timestamp. This is for their records and for any legal situations. A print option would be nice but PDF download covers that.

**Assistant:** Great, I think I have everything I need. Let me summarize the key decisions before I write this up:

1. Multiple templates per org, draft/published workflow, only owners can publish
2. Basic rich text editor for template content
3. Public signing URL -- works pre-filled (for known customers) or blank (QR/generic link)
4. Drawn signature canvas, capture IP/timestamp/user-agent for legal defensibility
5. Minor/guardian flow: configurable age cutoff (default 18), guardian signs for 1+ minors
6. Statuses: signed, expired, voided. Expiration configurable per template (default 365 days)
7. Organization-wide validity (not per-location)
8. Template versioning with optional "require re-sign" on material changes
9. PDF download of signed waivers
10. Informational expired-waiver indicators on customer profiles (no blocking)

**User:** That's exactly right. Ship it.
