# Adversarial Review Lenses

Apply relevant lenses. Skip empty ones. Order findings by severity.

1. **Assumptions That May Not Hold** — Environmental, behavioral, or scale assumptions. What breaks if they're wrong?
2. **Failure Modes & Edge Cases** — Race conditions, partial failures, concurrent access, boundary conditions. What's the blast radius?
3. **Overengineering** — Abstractions, patterns, or infrastructure beyond current needs. Could a simpler approach work?
4. **Code Design & Coupling** — Tight coupling, leaky abstractions, dependency direction violations. Will this be painful to change?
5. **Scope Creep / Scope Drift** — Features or complexity beyond what Requirements/Scope defined. Is the design solving problems nobody asked for?
6. **Requirements Coverage Gaps** — User stories or FRs with no corresponding behavior spec or build phase. What got dropped?
7. **Implementation Readiness** — Missing file paths, vague acceptance criteria, unresolved "TBD" items. Could an agent actually build this?
8. **Security & Access** — Permission gaps, trust boundary violations, unvalidated input, abuse vectors.
9. **Operational Readiness** — Missing monitoring, no rollback plan, migration risks, cost unknowns.
10. **Maintenance Burden** — Custom solutions where libraries exist, patterns that diverge from codebase norms, future upgrade risks.
11. **Simpler Alternatives** — Could a library, existing service, or different approach eliminate entire sections of the design?
12. **Should This Be Solved At All?** — Is the problem real? Is this the right layer to solve it? Would doing nothing be acceptable?
13. **Feasibility & Phasing** — Are phases ordered by dependency? Are vertical slices truly vertical? Is the timeline realistic?
