# Digital Waiver System -- Discovery Transcript

**Assistant:** I've explored the RangeOps codebase and I can see waivers are already on the roadmap -- the permissions layer defines `waiver_template` and `waiver` resources with role-based access, and the README lists waivers as a core platform feature. But there's no schema, UI, or business logic built yet. I have a few questions to make sure we scope the right thing.

First -- when you say customers sign on their phone, what's the flow you're imagining? Do they pull up a link themselves (like scanning a QR code at the front desk), or does a staff member hand them a tablet?

**User:** Both, really. Ideally they get a text or email before they even come in, like when they book a lane. But for walk-ins we'd have a QR code at the counter and they scan it with their phone. Some ranges have a kiosk iPad too, so that'd be nice but not essential right away.

**Assistant:** Got it -- so there are three entry points: (1) a pre-visit link sent via email/SMS, (2) a QR code for walk-ins, and (3) eventually a kiosk mode. Let me ask about the waiver content itself. Is this a single standard liability waiver, or do different ranges need different waiver text? For example, does your pistol range have a different waiver than an archery section?

**User:** Right now it's one waiver per location, but I could see wanting different ones. Like we have a standard range waiver and then if someone wants to rent a full-auto they have to sign an extra one. So yeah, multiple waiver templates per location, each one tied to what the customer is doing.

**Assistant:** That makes sense. So a template system where you create waiver documents, assign them to locations or specific offerings, and the system figures out which ones a customer needs to sign. How about versioning -- when you update your waiver text, what should happen with people who signed the old version?

**User:** We need to keep the old ones on file, definitely. For legal purposes we have to show exactly what somebody signed and when. If we update the waiver, new customers get the new version, but the old signed copies stay as-is. Our lawyer is pretty firm on that.

**Assistant:** That's a critical legal requirement -- immutable signed records with the exact text they agreed to. What about expiration? Do waivers need to be re-signed periodically?

**User:** Yeah, annually. Most ranges do it every 12 months. When a membership renews we need to check if their waiver is still current. If it expired, they can't use the range until they re-sign.

**Assistant:** So waiver status becomes a gating condition for range access, similar to how membership status works. That ties into your entitlements system. Speaking of which -- do you need the signature itself to be captured? Like a drawn signature on the phone screen, or is a checkbox "I agree" plus a typed name sufficient?

**User:** We need an actual drawn signature. The insurance companies want to see it. A checkbox doesn't cut it for liability waivers in this industry. Some of our competitors use drawn signatures and the insurance adjusters treat it like a wet signature.

**Assistant:** Understood -- a canvas-based signature capture, stored as an image. What about minors? Shooting ranges often have rules about parental consent.

**User:** Big deal for us. If someone is under 18, a parent or guardian has to sign for them. We need to capture who the guardian is and their relationship. Some states require the guardian to be present and also sign the range rules separately.

**Assistant:** That adds a parent/guardian co-signature flow. Is there a minimum age you enforce, or does that vary by location?

**User:** Varies by location and by what they're doing. Some locations allow 12+ with a parent, others are 14+. For rentals of certain firearms it might be 21+. We'd want that to be configurable.

**Assistant:** Makes sense -- that ties into your existing offering rules system. Now, on the staff side: what does the desk worker need to see? When a customer walks up, what questions does the waiver system need to answer for them?

**User:** Mainly: has this person signed a current waiver, yes or no. If not, they need to sign before we can assign them a lane. I'd love a simple green check or red X on the customer record. And for auditing, the ability to pull up any customer and see their waiver history -- what they signed, when, which version.

**Assistant:** A clear waiver status indicator on the customer profile with drill-down history. Final question -- any thoughts on offline capability? What happens if your internet goes down?

**User:** We've thought about that. Honestly, it hasn't been a big deal because our POS and everything else is cloud-based too. If the internet is down we have bigger problems. So no, I don't think offline support is needed for v1.

**Assistant:** That simplifies things. One more -- do you have any compliance requirements around data retention? How long do you need to keep signed waivers?

**User:** Our lawyer says 7 years minimum after the waiver expires. Longer if there's a minor involved -- until they turn 25 basically. We've had insurance claims come up 3-4 years after an incident so we can't be deleting anything.

**Assistant:** Got it -- long-term retention with different rules for minors. That's enough for me to put together a thorough scope. Let me go write that up.
