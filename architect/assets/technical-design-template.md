<!-- Template for architect skill. Write as ## Technical Design in the living doc. -->
<!-- Include relevant subsections. Omit any that would say "N/A." -->

## Technical Design

### Data Models

#### <ModelName>
- **Fields**: name, type, constraints
- **Relationships**: foreign keys, associations
- **Migration notes**: changes to existing models

### Behavior Specs

#### <Behavior Name>
- **Trigger**: <what initiates>
- **Steps**: <numbered>
- **Result**: <what user sees>
- **Variations**: <conditional paths>

### Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| | | critical / warning / graceful |

### Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why>

### Assumptions & Unknowns

- **Assumption**: <statement>. *Risk if incorrect: <impact>*
- **Unknown**: <question>. *Risk if incorrect: <impact>*

### Documentation Impact

- **Must update**: <docs that will become inaccurate>
- **New docs needed**: <new concepts requiring documentation>

### Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| | | stale docs / incomplete impl / intentional / unclear | |

### Operational Considerations

- **Rollout strategy**:
- **Backward compatibility**:
- **Feature flags**:
- **Performance / cost**:
- **Monitoring**:
- **Failure recovery**:

### Security & Access

- **Permissions affected**:
- **Sensitive data**:
- **Trust boundaries**:
- **Abuse risks**:

### Code Design & Boundaries

- **Key interfaces/abstractions**:
- **Dependency direction**:
- **Patterns applied**:
- **Extension points**:

### Testing Strategy

- **Unit tests**:
- **Integration tests**:
- **End-to-end tests**:
- **Test data**:
- **Acceptance verification**:

### Phased Build Plan

#### Phase 1: <Title>
**Depends on**: Nothing / Phase N
**Decisions**: #1, #2
**Requirements coverage**: FR-1, FR-2, User Story: <name>
**What**: <vertical slice description>
**Acceptance criteria**:
- [ ] <criterion>
