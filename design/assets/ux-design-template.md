<!-- Template for design skill. Write as ## UX Design in the living doc. -->
<!-- Include relevant subsections. Omit any that would say "N/A." -->

## UX Design

### Information Architecture

- **Location**: <nav path>
- **New nav items**: <if any>
- **Changes to existing nav**: <if any>

### User Flows

#### <Flow Name> (maps to: <User Story from Requirements>)
**Entry point**: <where>
**Precondition**: <what must be true>

1. User <action>
2. System <response>
   - **Success**: <what happens>
   - **Error — <type>**: <what user sees>
   - **Loading**: <what user sees>
3. ...

### Screen Inventory

#### <Screen/View Name>
- **Purpose**: <what for>
- **Entry points**: <how users get here>
- **States**: Empty: <desc> | Loading: <desc> | Default: <desc> | Error: <desc + recovery>
- **Primary actions**: <what users can do>

### Component Inventory

| Component | Exists? | Source/Path | Notes |
|-----------|---------|-------------|-------|
| | | | Reuse as-is / Extend / New — follows <pattern> |

### Interaction Specs

#### <Interaction Name>
- **Trigger**: <what initiates>
- **Behavior**: <step by step>
- **Keyboard**: <if applicable>
- **Responsive**: <if applicable>

### Accessibility

- **Focus management**: <modals, drawers, dynamic content>
- **Keyboard navigation**: <tab order, shortcuts>
- **Screen reader**: <announcements, live regions, aria>
- **Visual**: <color-independent indicators, contrast, motion>

### Content & Copy

| Element | Text | Notes |
|---------|------|-------|
| <button/label/heading/error/empty state> | <exact text> | <context> |

### External Design References

| Screen | Tool | Link | Status |
|--------|------|------|--------|

### Assumptions & Open Questions

- **Assumption**: <statement>. *Impact if wrong: <consequence>*
- **Open question**: <question>. *Needed by: <when>. Affects: <flows/screens>*

### PRD Addendum

Gaps discovered during UX design, resolved inline. Backport to Requirements if substantive.
- **<FR/US reference>**: <gap + resolution>
