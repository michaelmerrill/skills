# Glossary: Digital Waivers

> Glossary generation was evaluated but skipped.

## Rationale

The skill's glossary check triggers when: "PRD introduces 3+ domain nouns not in codebase, OR naming conflicts between PRD/code/UI detected."

**Assessment**:
- The PRD introduces domain nouns: "waiver template," "waiver," "signing page," "e-signature," "guardian," "minor." However, these terms are unambiguous in context and map directly to new schema objects (`waiver_template`, `waiver`) or UI concepts.
- The codebase already uses "customer," "organization," "member," "location" — no naming conflicts with PRD terms.
- The permissions layer already stubs `waiver_template` and `waiver` as resource names — the codebase and PRD agree on naming.
- No conflicts between PRD, scope doc, or codebase terminology were detected.

**Decision**: Glossary generation was not required. The terms introduced by the PRD are straightforward, not overloaded, and consistent with codebase naming conventions. The design document uses canonical names that match both the PRD and the intended schema (`waiver_template`, `waiver`, `customer`).

If naming ambiguity emerges during implementation (e.g., "signer" vs "customer" confusion), a glossary should be generated at that point.
