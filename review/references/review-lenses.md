# Code Review Lenses

Apply relevant lenses. Skip empty ones. Order findings by severity.

1. **Requirements Coverage** — Every FR/story addressed by this issue has corresponding code. No partial implementations or silent omissions.
2. **Architecture Conformance** — ADRs followed. Dependency direction correct. Specified patterns used. No ad-hoc alternatives to designed approaches.
3. **API Contract Fidelity** — Endpoints, methods, request/response shapes, error codes, auth requirements match tdd.md contracts exactly.
4. **Behavior Correctness** — Code behavior matches tdd.md behavior specs: trigger → steps → result. Variations and invariants hold.
5. **Edge Case Handling** — Critical/warning edge cases from tdd.md have explicit mitigations. Failure modes degrade gracefully.
6. **Security & Access** — Auth checks present per security model. Input validated at trust boundaries. No permission bypasses. PII handled per spec.
7. **Error Handling** — Errors caught, logged, and surfaced appropriately. No swallowed exceptions. User-facing errors match spec copy.
8. **Observability** — Specified logging events emit with correct structured fields. Metrics instrumented. Health checks present if required.
9. **Test Quality** — Tests assert meaningful behavior, not implementation details. Edge cases tested. Mocks are realistic. No false-passing tests.
10. **Code Patterns** — Follows codebase conventions (naming, file structure, import patterns). No unnecessary divergence from established patterns.
