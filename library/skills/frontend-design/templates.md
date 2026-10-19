# Frontend design report formats

Fill in the brackets. Drop a block that has nothing in it rather than writing "none". Severity words are the same
in every report: **blocker** (stops someone finishing the task), **major** (slows them down or confuses them),
**minor** (polish).

## B. Critique
```markdown
## Critique: [screen or flow] ([stage: rough / refining / nearly final])
For: [who] doing [main job]. Focus: [area, or "whole screen"].

**In short:** [one or two sentences: the strongest part and the biggest chance to improve]

### Keep
- [specific thing that works, and why]

### Findings
| Where | Problem | Why it matters | Severity | Change |
|---|---|---|---|---|
| [element] | [what is wrong] | [user need or principle] | blocker / major / minor | [concrete fix] |

### Order of the eye
First: [element] ([right or wrong, and why]). Then: [path]. Too loud: [..]. Too quiet: [..].

### Top three changes
1. [change]: [why, and how]
2. [change]: [why, and how]
3. [change]: [why, and how]
```

## C. Design system audit
```markdown
## Design system audit: [scope] ([date])
Searched: [folders and patterns used]

| Category | Tokens defined | Raw values found in code | Worst files |
|---|---|---|---|
| Color | [n] | [n] | [paths] |
| Spacing | [n] | [n] | [paths] |
| Type | [n] | [n] | [paths] |
| Radius, shadow, motion | [n] | [n] | [paths] |

### Names that disagree
| Idea | Names in use | Proposed name |
|---|---|---|

### Component coverage
| Component | States present | States missing | Documented? |
|---|---|---|---|

### Fix first
1. [..]
```

## C. Component page
```markdown
## [Component]
[What it is for. When to pick something else instead.]

| Variant | Pick it when |
|---|---|

| Property | Type | Default | Meaning |
|---|---|---|---|

| State | Looks like | Does |
|---|---|---|
| default / hover / focus / active / disabled / loading / error | | |

Accessibility: role [..]; keys [..]; a screen reader says [..].
Do: [..]. Don't: [..] (seen in [where]).
```

For a proposed new component, add above the tables: the need it meets, the closest existing components and what
each lacks, the tokens it uses, and the open questions.

## D. Interface text
```markdown
## Text for: [screen, element, moment]
User is: [doing what, feeling how]. Voice: [..]. Limit: [characters, if any].

**Use:** [the recommended text]

| Option | Text | Tone | Fits when |
|---|---|---|---|
| A | | | |
| B | | | |

Why: [reason for the pick]
For translators: [idioms, expected growth, plural or gender issues]
```

## E. Accessibility audit
```markdown
## Accessibility audit: [screen or product] (WCAG 2.2 AA, [date])
Tested with: [automated tool], keyboard, [screen reader and browser, or "no screen reader test"]
Found: [n] blockers, [n] major, [n] minor

| # | Principle | Problem | Criterion | Severity | Fix |
|---|---|---|---|---|---|
| 1 | Perceivable / Operable / Understandable / Robust | [..] | [e.g. 2.4.7 Focus Visible] | [..] | [..] |

### Contrast
| Element | Text color | Background | Ratio | Needed | Result |
|---|---|---|---|---|---|

### Keyboard
| Control | Reached in order? | Enter / Space | Escape | Arrows |
|---|---|---|---|---|

### Screen reader
| Control | Announced as | Problem |
|---|---|---|

### Fix order
1. [blocker]: [who it stops, and from doing what]
```

## F. Developer handoff
```markdown
## Spec: [screen or feature]
What and for whom: [..]. Design plan: [link]. Stack: [..].

### Layout
| Width | Layout |
|---|---|
| Phone (under [n] px) | [..] |
| Tablet ([n] to [n] px) | [..] |
| Desktop (over [n] px) | [..] |

### Tokens
| Token | Value | Used for |
|---|---|---|

### Components
| Component | Variant | Properties | Beyond standard |
|---|---|---|---|

### States and interactions
| Element | State or trigger | Behavior | Motion (duration, easing) |
|---|---|---|---|

### Content and edge cases
- Empty: [..]
- Long text: [wrap or truncate rule, limit]
- Translated text: [room to grow]
- Loading and slow network: [..]
- Missing or huge data: [..]

### Accessibility
Focus order: [..]. Names and roles: [..]. Keys: [..]. Announced on change: [..].

### Why it is this way
- [decision]: [reason the developer needs to make good calls]
```
