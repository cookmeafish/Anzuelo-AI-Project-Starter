---
name: frontend-design
description: Every design job on an interface, split by situation - designing a new or reshaped screen (subject, direction, tokens, layout, states), critiquing an existing design, keeping a design system's tokens and components consistent, writing interface text, reviewing accessibility against WCAG, and writing a spec developers can build from - so the result is distinctive, usable and accessible instead of a generic template, then proven with the gui-review-loop. Use for any web page, app screen, dashboard, desktop or mobile UI, HTML report or form being designed, restyled, reviewed or handed off, when the user asks for something that looks better or less generic, for feedback on a mockup or screenshot, for button, error or empty-state wording, for an accessibility check, or for a design spec.
triggers: frontend design, ui design, design the page, design the screen, design the landing page, landing page design, visual design, redesign, color palette, typography, design review, critique this design, feedback on this design, review this mockup, review this screen, design system, design tokens, component library, document this component, ux copy, microcopy, button text, button label, error message wording, empty state text, accessibility, accessible, a11y, wcag, screen reader, keyboard navigation, color contrast, design handoff, design spec, developer spec
---
# Frontend design: decide on purpose, check honestly, hand over clearly

**A design is a set of choices made for this subject and these users.** Defaults chosen because they came to mind
first look like every other generated screen. Choices made from the subject look like they belong to it. Make the
choices on purpose, write them down, check them against real criteria, and pass them on so nothing has to be guessed.

Works for any stack: web, desktop or mobile. The gui-review-loop skill proves any built result with screenshots, and
the gui runbook (`docs/playbooks/gui.md`) wraps both.

## Pick the situation
| Situation | Do |
|---|---|
| A new screen, page, report or form, or a restyle of one | **A** |
| "What do you think of this?", feedback on a mockup, screenshot or live page | **B** |
| Tokens and components drifting apart, documenting a component, adding a new one | **C** |
| Button labels, error messages, empty states, dialogs, onboarding text | **D** |
| "Is this accessible?", a WCAG check, before release or handoff | **E** |
| The design is settled and someone else will build it | **F** |

Several can apply. A new screen (**A**) uses **D** for its words and ends with a short **E** pass. A critique (**B**)
can grow into a full **E** audit. Name the section you used in the answer: `Frontend design: A (design plan)`,
`Frontend design: B (critique)`.

All report formats are in [templates.md](templates.md). Craft detail is in [references.md](references.md).

**If the project connects to a design tool** (a Figma or similar connection), read frames, tokens and component
properties from it instead of guessing from a picture. **If it connects to a tracker, wiki or feedback tool**, the
same goes for tickets, style guides and user complaints. None of these is required: a screenshot, a file, a URL or a
written description is enough to start.

## A. Design a new screen or page

### A1. Pin down the subject
1. **Who uses it, and for what one main job.** Read `docs/BRIEF.md`, any notes the project keeps on the user's
   taste, and, for apps, `docs/foundation.md` section 3 (usability defaults, plus the design tokens and design
   direction rows if they are already filled). If the request doesn't say what the product is, propose one subject,
   audience and main job, and confirm it with the user (one question).
2. **Gather the subject's world:** its materials, vocabulary, tools, places and habits. A tool for accountants and a
   game for children should not share a look. Distinctive choices come from here, not from taste in general.
3. **Use real content.** Real labels, real data shapes, realistic lengths. Lorem ipsum hides the problems that real
   content shows. When you must write the copy yourself, it gets the same care as the layout (section **D**):
   generic copy makes a page feel as templated as generic styling does.
4. **Respect what exists.** If the project already has tokens, components or a brand, extend them (section **C**).
   Don't start a second design system. If the user named a direction, follow it exactly, even if it is a common one.

### A2. Write a short design plan
Before code, write a compact plan (in `docs/plans/` or the answer). Either way, the answer names it as the "design
plan" and sums it up; the Stop check looks for that.
- **Direction:** one or two sentences on the feel and why it fits this subject and audience.
- **Color:** 4 to 6 named roles (background, surface, text, muted text, accent, danger), each with a light and a dark
  value. Check contrast for every text and background pair now (WCAG AA: 4.5:1 for body text, 3:1 for large text and
  UI parts).
- **Type:** one or two families with clear roles, a type scale, weights and line heights. Pick faces for this
  subject, not the ones you would use on any project. Check they are licensed for use and load or ship them properly.
- **Space and shape:** a spacing scale, corner radii and elevation that vary with hierarchy, not one value everywhere.
- **Layout:** for the main screen, sketch two or three options (a sentence each plus a rough ASCII wireframe) and
  pick one with a reason. Then the main screens for phone and desktop: where the eye lands first, what is primary,
  what is behind an expander, and how text aligns (left, centered or justified, chosen on purpose).
- **First view:** what greets people on arrival. Lead with the thing most typical of the subject's world (a
  headline, an image, a live preview, the actual tool, a moment of interaction). The big-number hero with a small
  label and a gradient is the stock answer; use it only when it truly is the best one.
- **Motion:** what moves, when, and why. Durations and easing as tokens.
- **The one memorable thing:** a single place where the design takes a risk. Everything else stays quiet.

### A3. Challenge the plan
1. For each part, ask: would I produce this same choice for any similar request? Sketch what you would make for a
   neighboring request to find out. Where the two match, it is a default, not a decision. Replace it with something
   drawn from A1, and say what changed and why. [references.md](references.md) lists the usual defaults.
2. Where the user or the brief fixed a direction, keep it exactly, even if it is on that list. Their words win; the
   challenge applies only to the choices left open.
3. Check the plan against the usability floor below. A striking design that fails it is not done.
4. Cut one decoration that does not help the user understand or act.

### A4. Build to the plan
1. **Tokens first.** Put every color, font, size, space, radius, shadow and duration in the project's token layer
   (CSS custom properties, a theme file, platform resources). Components use tokens, never raw values. Define both
   themes from the start. In an app project, that file is the one named in the "Design tokens" row of
   `docs/foundation.md` section 3; fill that row with its path if it is still empty.
2. **Structure means something.** Borders, numbering, labels and dividers carry information. Number things only when
   they are a sequence. Group by meaning, not into identical cards.
3. **Typography does the work.** Clear differences between title, section and body. Body lines under about 80
   characters. Where type is the headline or a visual element, treat its setting (size, weight, width, spacing) as
   part of the design, not just a carrier for words. Avoid habits that mark generated pages: a single highlighted
   word in a headline, all-caps labels on everything, a small label above every heading.
4. **Motion with a purpose.** Motion that answers the user's action (opening, saving, moving) shows what changed and
   is welcome. Unprompted motion is rare: one planned moment beats an entrance effect on every section. Honor the
   system's reduced-motion setting. Animate only cheap properties and stop what is off-screen.
5. **Every state, not just the happy one:** empty (says what to do first), loading (shows progress or a skeleton,
   no layout jump), error (names the problem plainly and the way out of it), partial and long data, disabled, and
   success.
6. **Words are design.** Decide what a screen must say before writing it, then write it with section **D**.
7. **Keep styles clean.** Watch for rules that override each other (specificity fights, spacing set in two places).
   One source for each value.

### A5. Hand off to the review loop
Run the gui-review-loop skill on every screen and state you touched: desktop and phone, light and dark, with the
empty, loading and error states included. Look at the screenshots while you build too, not only at the end; a
picture shows what reading the code hides. Judge against `docs/checks/visual-review.md` and the plan above. Fix and
repeat until a full round finds nothing. Update the plan if the build changed a decision.

### A6. Record the decisions
In an app project, write the direction and the one memorable thing into the "Design direction" row of
`docs/foundation.md` section 3, and the token file's path into the "Design tokens" row. Note in `docs/DECISIONS.md`
what was tried and dropped, so the next design pass starts from it instead of repeating it.

## The usability floor (never traded for looks)
- Readable contrast (WCAG AA) in both themes, including placeholders, borders of inputs, and disabled text.
- Full keyboard use with a visible focus style. Labels on every input. Screen reader names on icon-only buttons.
- Works at phone width (no sideways scroll) and on desktop, with text zoomed to 200%. Touch targets about 44px.
- Both light and dark themes look designed, not inverted.
- One obvious primary action per view. Secondary options collapsed.
- Color is never the only signal (pair it with text, an icon or a pattern).

The floor is built in, not announced: don't list it as a feature on the page. Section **E** is the full check.

## B. Critique an existing design
The goal is a short list of changes that would help users most, each backed by a reason. Opinions without a reason
are not feedback.

1. **Get the context first:** what it is, who it is for, the one job it must do, and how far along it is (rough
   idea, being refined, nearly final). Ask once if it is unknown. Ask whether to focus on one area.
2. **Look at the real thing.** Open the screenshot, file or connected frame. For something already built, take
   screenshots with `node tools/screenshot.mjs` (desktop and phone, light and dark) and open every one.
3. **Glance test (about 3 seconds):** note what a newcomer sees first, whether that is the right thing, and whether
   the purpose of the screen is clear without reading.
4. **Walk the main task** as that user would: count steps, find dead ends, unclear controls, things that look
   clickable and are not, and steps that could go.
5. **Hierarchy and layout:** the order the eye follows, what is too loud or too quiet, spacing that groups the wrong
   things, type sizes that don't separate levels.
6. **Consistency:** compare with the project's tokens and components (section **C**). Same-looking things should
   behave the same way.
7. **Words:** labels, errors and empty states against section **D**.
8. **Accessibility:** a quick pass on contrast, target size, readable text and alt text. Offer a full **E** audit if
   anything fails.
9. **Write it up** with the critique template: what works (specific, so it is kept), findings with a severity
   (blocks the task, slows people down, or polish), and the top three changes, each with why and how.

Match depth to the stage. A rough idea gets feedback on structure and flow, not on pixel spacing. A nearly final
design gets the detail. Point at the element ("the save button sits below the fold on phone"), never a mood ("feels
off").

## C. Keep a design system consistent
A design system here means three layers: **tokens** (named values for color, type, spacing, radius, shadow and
motion), **components** (buttons, inputs, dialogs, each with variants, sizes and states) and **patterns** (forms,
navigation, tables, messages built from components). The project keeps one; never start a second.

Pick the job:
- **Audit.** Search the code for raw values that should be tokens (hex colors, pixel sizes, font names outside the
  token file) and count them per category. List names that follow different schemes for the same idea. For each
  component, check that every state exists (default, hover, focus, active, disabled, loading, error) and that its
  docs say when to use it. Report with the audit template; fix the worst offenders first.
- **Document a component.** Write what it is for and when not to use it, its variants with the case for each, its
  properties, how each state looks and behaves, and its accessibility (role, keys, what a screen reader says). Add
  one short do and don't pair from a real misuse. Put it next to the component or in the project's docs folder.
- **Add a component or pattern.** First show why the existing ones can't do the job (list the closest and what each
  lacks). Then propose its properties, variants and states using only existing tokens. Add a token only when no
  existing one fits, and say why. List the open questions for review.

Rules that keep it healthy:
- Reuse beats invention: the system exists so the same problem isn't solved twice in different ways.
- Components combine; they don't grow a switch for every case.
- A change that breaks existing uses says what breaks and how to move over, before it lands.
- An undocumented component will be rebuilt by someone who didn't find it. Document while building.
- Broad coverage first: short docs for most components beat perfect docs for a few.

## D. Write interface text
Every piece of text exists to help someone understand or act. Before writing, know the screen, what the user is
trying to do, how they likely feel at that moment, the product's voice, and any length limit.

- **Plain and exact.** Say what you mean in the user's words. Name things by what the user knows, not by how the
  system is built. Describe what a thing does instead of selling it; clear beats clever.
- **Short.** The fewest words that still carry the whole meaning. Cut every word that doesn't help.
- **One word for one thing** across the whole product. Consistent words are how people learn their way around.
- **Sentence case, active voice, plain verbs,** a tone that fits the audience, one job per piece of text.

| Element | How to write it |
|---|---|
| Button or link | A verb plus its object that names the result ("Save changes", "Export report"), never "Submit" or "OK". The confirmation repeats the verb ("Saved") |
| Error | What went wrong, why if it helps, and what to do now, in the product's voice. No apology, no blame, never vague. Keep what the user typed |
| Empty state | What will appear here, why it is empty now, and the one action that fills it |
| Confirmation dialog | Ask about the specific action ("Delete 3 files?"), state what can't be undone, label the buttons with the outcomes ("Delete files" and "Keep files") |
| Loading | Say what is happening and, when slow, roughly how long |
| Tooltip | Only what the label can't say. If it repeats the label, delete it |
| Onboarding | One idea per step, shown when it is needed, skippable |

Tone shifts with the moment: calm and helpful for errors, direct for warnings, brief and warm for success (no
fireworks), neutral for everything else. When asked for copy, give one recommendation, two or three alternatives with
the tone and situation each fits, the reason for the pick, and notes for translators (idioms to avoid, room for text
that grows longer when translated). Template in templates.md, more in references.md.

## E. Accessibility review
Check against **WCAG 2.2 level AA**, the current W3C version (Recommendation, latest edition 2024-12-12). Some
organizations still require 2.1; 2.2 adds to it and drops 4.1.1 (Parsing), so passing 2.2 AA covers 2.1 AA.

1. **Run an automated checker** if the stack has one (axe, Lighthouse or the platform's own). It finds only part of
   the problems, so it is a start, not a verdict.
2. **Keyboard only.** Tab through every control: everything reachable, order matches the visual order, focus always
   visible and never hidden behind a sticky header, no trap (dialogs close with Escape and return focus).
3. **Contrast.** Measure every text and background pair with a tool, in both themes, plus input borders, icons and
   focus rings. Record each in the contrast table.
4. **Zoom and reflow.** Text at 200%, and a 320 CSS pixel wide view: nothing lost, no sideways scroll.
5. **Screen reader.** With NVDA or Narrator on Windows, VoiceOver on Apple devices, or TalkBack on Android, check what
   each control is announced as, that headings and landmarks give a map, and that status messages are spoken.
   Testing with real assistive technology catches what any reading of the code misses; say so if it wasn't done.
6. **Write findings** with the accessibility template, grouped under the four WCAG principles, each with its
   criterion number, severity and fix. Fix order: anything that blocks a task for someone first.

| Criterion (level) | What to check |
|---|---|
| 1.1.1 Non-text Content (A) | Meaningful images have alt text; decorative ones have empty alt |
| 1.3.1 Info and Relationships (A) | Headings, lists, tables and labels are real markup, not just styling |
| 1.4.1 Use of Color (A) | Color is never the only signal |
| 1.4.3 Contrast (Minimum) (AA) | 4.5:1 for text, 3:1 for large text (18 pt, or 14 pt bold) |
| 1.4.4 Resize Text (AA) and 1.4.10 Reflow (AA) | 200% text; 320 CSS px width without sideways scroll |
| 1.4.11 Non-text Contrast (AA) | 3:1 for control borders, icons and focus indicators |
| 2.1.1 Keyboard (A) and 2.1.2 No Keyboard Trap (A) | Everything works from the keyboard, and focus can always leave |
| 2.4.3 Focus Order (A), 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (Minimum) (AA) | Logical order, visible focus, not covered |
| 2.5.7 Dragging Movements (AA) | Anything dragged can also be done with a single tap or click |
| 2.5.8 Target Size (Minimum) (AA) | At least 24 by 24 CSS px. This project aims for about 44, the AAA level of 2.5.5 |
| 3.2.1 On Focus and 3.2.2 On Input (A) | Focusing or changing a field doesn't jump somewhere unexpected |
| 3.3.1 Error Identification (A), 3.3.2 Labels or Instructions (A), 3.3.3 Error Suggestion (AA) | Errors are named in text with a fix; every input has a label |
| 3.3.8 Accessible Authentication (Minimum) (AA) | Sign-in doesn't depend on solving a puzzle or remembering without help; paste works |
| 4.1.2 Name, Role, Value (A) and 4.1.3 Status Messages (AA) | Every control announces what it is and its state; updates are spoken |

Frequent misses: unlabeled inputs, icon buttons with no name, focus lost after a dialog closes, missing page
landmarks, media that plays by itself, and time limits that can't be extended.

## F. Hand off to developers
The developer builds exactly what the spec says and guesses the rest. Write the spec so there is nothing left to
guess, and say why for any choice that isn't obvious.

1. **Overview:** what the screen does and for whom, with a link to the design plan from **A**.
2. **Layout:** grid, the widths where the layout changes, and what changes at each (phone, tablet, desktop).
3. **Tokens, not raw values:** name the token for every color, size, space, radius, shadow and duration
   (`space-4`, not 16px). Flag any value with no token.
4. **Components:** which ones, which variant and properties, and any behavior beyond the standard.
5. **States and interactions:** default, hover, focus, active, disabled, loading, error, empty and success for each
   interactive element. Click, tap and gesture behavior. Motion with trigger, duration and easing.
6. **Content rules:** length limits, how long text wraps or truncates, translated text that runs longer, missing or
   huge data, slow connections.
7. **Accessibility:** focus order, names and roles, keys, and what is announced on change (from **E**).
8. **Assets and links:** exported images and icons, and the ticket if the project connects to a tracker.

Use the handoff template. Ask for the tech stack if unknown, so notes fit it.

## Done when
- [ ] The answer names the section used (`Frontend design: <letter>`) (hook: design-plan).
- **A:**
  - [ ] Subject, audience and main job are written down, confirmed if they were guessed (judgment: whether a guess was confirmed shows only in the conversation).
  - [ ] A design plan exists (judgment: whether the plan is real and revised needs a reader) (direction, color, type, space, layout options, first view, motion, the one memorable
        thing), and the generic parts were revised with a reason.
  - [ ] All values live in tokens, with light and dark values, and contrast was checked for each text pair (judgment: no check reads the tokens or contrast yet).
  - [ ] Empty, loading, error and long-data states exist and say what to do next (judgment: whether each state guides the user needs a human eye).
  - [ ] The usability floor holds: keyboard, focus, labels, reduced motion, phone and desktop, zoom (judgment: needs a person to try keyboard, zoom and phone).
  - [ ] The gui-review-loop ended with `Visual review: PASS after N rounds` (hooks: gui-review-loop, gui-review-report).
  - [ ] App projects: the "Design tokens" and "Design direction" rows in `docs/foundation.md` section 3 are filled (judgment: only app projects have the rows).
- [ ] **B:** findings point at specific elements with a reason and a severity (judgment: the quality of a critique needs a reader), what works is named, and the top three
      changes are ranked.
- [ ] **C:** audit counts come from searching the code, not from estimates; new parts use existing tokens (judgment: how the counts were found shows only in the work).
- [ ] **D:** each element has a recommendation, alternatives and a reason; words match the rest of the product (judgment: whether the words match needs a reader).
- [ ] **E:** every finding cites a WCAG 2.2 criterion (judgment: what was measured shows only in the work); contrast was measured, not judged by eye; what wasn't tested
      (for example a real screen reader) is said.
- [ ] **F:** every state and edge case is covered, and every value is a token or flagged (judgment: full coverage needs a reviewer).
- [ ] Whenever screens change, accessibility was checked and reported as "Accessibility: <what was checked> - PASS/FAIL" (hook: a11y-checked).

## Pitfalls
- Starting with code and deciding the look along the way. The defaults win when nothing was decided.
- Boldness everywhere. Three loud ideas fight each other. Pick one.
- A dark theme made by inverting colors: muddy surfaces, invisible borders, accents that glare.
- Designing only the full, happy screen. Real users see the empty and error screens first.
- Hardcoded colors and sizes in components. The next change, or the second theme, breaks them.
- Fonts that look right on your machine but are not loaded or licensed for the product.
- Decorative motion on every element, or motion that ignores reduced-motion settings.
- Overriding a direction the user asked for because it appears on the list of common defaults.
- Numbered markers, borders and labels added for looks when the content is not a sequence or a group.
- A critique that lists only problems: the good parts then get "fixed" away too.
- Polishing pixels on a rough idea, or questioning the whole concept on a design about to ship.
- Calling a design accessible after an automated scan alone.
- Copy that is clever for the writer and puzzling for someone new.
- A spec that shows only the default state.

More detail on each area: [references.md](references.md). Report formats: [templates.md](templates.md).

Inspired by "frontend-design" in anthropics/skills (Apache 2.0, see LICENSE) and by the "design" plugin in
anthropics/knowledge-work-plugins (Apache 2.0, see LICENSE-design-plugin). Details in [SOURCE.md](SOURCE.md).
