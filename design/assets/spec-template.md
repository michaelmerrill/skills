<!-- Design Specification. Create as ./plans/<feature-name>/spec.md -->
<!-- Standalone design spec. Downstream: engineering reads for frontend architecture. -->
<!-- Include relevant subsections. Omit any that would say "N/A." -->

# Design Spec: <Feature Name>

> <date> | Status: Draft
> PRD: [prd.md](./prd.md)

## Information Architecture

- **Location**: <nav path>
- **URL structure**: <route pattern>
- **New nav items**: <if any>
- **Changes to existing nav**: <if any>

## User Flows

### <Flow Name>
**Maps to**: <User Story from PRD>
**Entry point**: <where>
**Preconditions**: <what must be true>

**Happy path**:
1. User <action>
2. System <response>
3. ...

**Branches**:
- **<Condition>**: <alternate path>

**Error paths**:
- **<Error type>**: <what user sees + recovery>

**Terminal states**: <where flow ends>

(include mermaid flowchart for flows with 2+ branches)

## Screen Inventory

### <Screen/View Name>
- **Purpose**: <why this screen exists>
- **Entry points**: <how users arrive>
- **Primary actions**: <what users can do>

| State | Condition | What user sees | Actions available |
|-------|-----------|---------------|-------------------|
| Empty | <when> | <description> | <actions> |
| Loading | <when> | <skeleton/spinner> | <actions> |
| Default | <when> | <description> | <actions> |
| Error | <when> | <message + recovery> | <actions> |
| Permission denied | <when> | <what instead> | <actions> |
| Partial | <when> | <description> | <actions> |

## Component Inventory

| Component | Exists? | Source/Path | Modifications | Notes |
|-----------|---------|-------------|--------------|-------|
| <name> | Yes / No | <path or "new"> | None / <changes> | <design system ref> |

## Interaction Specs

### <Interaction Name>
- **Trigger**: <what initiates>
- **Behavior**: <step-by-step>
- **Feedback**: <loading/success/error indicators>
- **Keyboard**: <shortcuts, tab order>
- **Undo**: <reversible? how?>

## Responsive Behavior

| Breakpoint | Layout changes | Hidden elements | Interaction changes |
|------------|---------------|-----------------|---------------------|
| Desktop (>1024px) | <default> | — | — |
| Tablet (768-1024px) | <changes> | <what hides> | <changes> |
| Mobile (<768px) | <changes> | <what hides> | <changes> |

## Accessibility

### Focus Management
- <modal/drawer/dynamic content focus behavior>

### Keyboard Navigation
- <tab order, shortcuts>

### Screen Reader
- <announcements, live regions, ARIA>

### Visual
- <color-independent indicators, contrast, reduced motion, touch targets>

## Content & Copy

| Element | Location | Text | Tone | Notes |
|---------|----------|------|------|-------|
| <button/heading/error/empty/toast> | <screen> | <exact text> | <formal/casual> | <char limit, i18n> |

## External Design References

| Screen/Flow | Tool | Link | Status |
|-------------|------|------|--------|
| <what> | Figma / Prototype | <URL or "N/A"> | Draft / Final |

## Assumptions & Open Questions

- **Assumption**: <statement>. *Impact if wrong: <consequence>*
- **Open question**: <question>. *Needed by: <when>. Affects: <flows/screens>*

## PRD Addendum

Gaps discovered during design. Backport to PRD if substantive.
- **<FR/US reference>**: <gap + resolution>
