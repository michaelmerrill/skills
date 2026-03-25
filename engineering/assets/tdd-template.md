<!-- Technical Design Document. Create as ./plans/<feature-name>/tdd.md -->
<!-- Standalone TDD. Downstream: plan reads for issue decomposition. -->
<!-- Include relevant subsections. Omit any that would say "N/A." -->

# TDD: <Feature Name>

> <date> | Status: Draft
> PRD: [prd.md](./prd.md) | Spec: [spec.md](./spec.md)

## System Context

<2-3 sentences: where this feature sits in the system.>

(C4 context diagram in mermaid)

## Architecture Decisions

### ADR-1: <Decision Title>
- **Status**: Accepted / Proposed
- **Context**: <forces at play>
- **Decision**: <what we decided>
- **Alternatives**: <option> — <why rejected>
- **Consequences**: <trade-offs accepted>

## Data Models

### <ModelName>

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| id | uuid | PK | — |
| <field> | <type> | <constraints> | <business rule> |

**Relationships**: <FKs, cardinality>
**Indexes**: <name, columns, why>
**Migration**: <new table / alter / backfill>

(ER diagram in mermaid)

## API Contracts

### `METHOD /path`
- **Auth**: <role/permission>
- **Request**: `{ "field": "type" }`
- **Response 200**: `{ "field": "type" }`
- **Errors**:
  | Status | Code | When |
  |--------|------|------|
  | 400 | VALIDATION_ERROR | <when> |
  | 403 | FORBIDDEN | <when> |
  | 404 | NOT_FOUND | <when> |
- **Rate limit**: <if applicable>
- **Idempotency**: <behavior on retry>

## Behavior Specs

### <Behavior Name>
**Maps to**: FR-N, Story: <name>
- **Trigger**: <what initiates>
- **Steps**: <numbered system actions>
- **Result**: <state change + user sees>
- **Variations**: <conditional paths>
- **Invariants**: <what must always hold>

## Edge Cases & Failure Modes

| # | Scenario | Expected Behavior | Severity | Mitigation |
|---|----------|-------------------|----------|------------|
| 1 | <scenario> | <system response> | Critical / Warning / Graceful | <approach> |

## Security Model

### Authentication & Authorization
- **New permissions**: <name, what they guard>
- **Permission checks**: <where enforced>

### Trust Boundaries
- <boundary> — <what's validated>

### Data Protection
- **PII fields**: <which, classification>
- **Encryption**: <at rest, in transit>

### Abuse Prevention
- **Vector**: <scenario>. **Mitigation**: <approach>

## Observability

### Logging
| Event | Level | Data | When |
|-------|-------|------|------|
| <event> | info / warn / error | <fields> | <trigger> |

### Metrics
| Metric | Type | Labels | Alert threshold |
|--------|------|--------|----------------|
| <name> | counter / gauge / histogram | <labels> | <threshold> |

### Health Checks
- <what to monitor, expected behavior>

## Testing Strategy

### Unit Tests
| Component | What to test | Approach |
|-----------|-------------|----------|
| <service> | <behavior> | <mock strategy> |

### Integration Tests
| Boundary | What to test | Setup |
|----------|-------------|-------|
| <API/DB> | <scenario> | <fixtures> |

### E2E Tests
| Flow | What to test | Tooling |
|------|-------------|---------|
| <journey> | <critical path> | <framework> |

## Operational Considerations

- **Rollout**: <big bang / feature flag / canary>
- **Feature flags**: <flag name, default>
- **Backward compat**: <breaking changes?>
- **Rollback plan**: <how to revert>
- **Perf targets**: <latency P50/P95/P99>
- **Scalability**: <what breaks at 10x/100x>
- **Cost**: <new infra, API costs>

## Code Design & Boundaries

### Key Interfaces
(actual code signatures)

### Dependency Direction
- <module dependencies>

### Patterns Applied
- <pattern> in <where> — <why>

### Extension Points
- <where future features plug in>

## Phased Build Plan

### Phase 1: <Title>
**Depends on**: Nothing / Phase N
**ADRs**: ADR-1, ADR-2
**Requirements**: FR-1, FR-2, Story: <name>
**What**: <vertical slice description>
**Acceptance criteria**:
- [ ] <criterion>

## Assumptions & Unknowns

| Type | Statement | Risk if wrong | Resolution plan |
|------|-----------|--------------|-----------------|
| Assumption | <statement> | <impact> | <how to validate> |
| Unknown | <question> | <impact> | <deadline> |

## Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| <what> | <sources> | stale docs / incomplete impl / intentional | <resolution> |

## Documentation Impact

- **Must update**: <docs that become inaccurate>
- **New docs needed**: <new concepts>
