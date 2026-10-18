---
name: frontend-design
description: Makes the design decisions for a new or reshaped interface before and while building it (subject, direction, tokens for color, type, spacing and motion, layout, states, copy), so the result is distinctive, usable and accessible instead of a generic template, then hands off to the gui-review-loop to prove it. Use for any web page, app screen, dashboard, desktop or mobile UI, HTML report or form that is being designed or restyled, or when the user asks for something that looks better, more modern or less generic.
triggers: frontend design, ui design, design the page, design the screen, landing page, visual design, redesign, color palette, typography, make it look
---
# Frontend design: decide first, then build

**A design is a set of choices made for this subject and these users.** Defaults chosen because they came to mind
first look like every other generated screen. Choices made from the subject look like they belong to it. Make the
choices on purpose, write them down, then build to them.

This skill covers the decisions before and during building. The gui-review-loop skill proves the result with
screenshots, and the gui runbook (`docs/playbooks/gui.md`) wraps both. Works for any stack: web, desktop or mobile.

## 1. Pin down the subject
1. **Who uses it, and for what one main job.** Read `docs/BRIEF.md`, any notes the project keeps on the user's
   taste, and, for apps, `docs/foundation.md` section 3 (usability defaults, plus the design tokens and design
   direction rows if they are already filled). If the request doesn't say what the product is, propose one subject,
   audience and main job, and confirm it with the user (one question).
2. **Gather the subject's world:** its materials, vocabulary, tools, places and habits. A tool for accountants and a
   game for children should not share a look. Distinctive choices come from here, not from taste in general.
3. **Use real content.** Real labels, real data shapes, realistic lengths. Lorem ipsum hides the problems that real
   content shows. When you must write the copy yourself, it gets the same care as the layout: generic copy makes a
   page feel as templated as generic styling does.
4. **Respect what exists.** If the project already has tokens, components or a brand, extend them. Don't start a
   second design system. If the user named a direction, follow it exactly, even if it is a common one.

## 2. Write a short design plan
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

## 3. Challenge the plan
1. For each part, ask: would I produce this same choice for any similar request? Sketch what you would make for a
   neighboring request to find out. Where the two match, it is a default, not a decision. Replace it with something
   drawn from step 1, and say what changed and why. [references.md](references.md) lists the usual defaults.
2. Where the user or the brief fixed a direction, keep it exactly, even if it is on that list. Their words win; the
   challenge applies only to the choices left open.
3. Check the plan against the usability floor below. A striking design that fails it is not done.
4. Cut one decoration that does not help the user understand or act.

## 4. Build to the plan
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
6. **Words are design.** Every piece of text exists to help someone understand or act; decide what a screen must
   say before writing it. Name things by what the user knows, not by how the system is built. Describe what a thing
   does instead of selling it; clear beats clever. Buttons say what they do ("Save changes", not "Submit"), and the
   result uses the same verb. Keep one word for one thing across the whole product. Errors speak in the product's
   voice, don't apologize, and are never vague. Sentence case, active voice, plain verbs, a tone that fits the
   audience, one job per piece of text. Details in references.md.
7. **Keep styles clean.** Watch for rules that override each other (specificity fights, spacing set in two places).
   One source for each value.

## The usability floor (never traded for looks)
- Readable contrast (WCAG AA) in both themes, including placeholders, borders of inputs, and disabled text.
- Full keyboard use with a visible focus style. Labels on every input. Screen reader names on icon-only buttons.
- Works at phone width (no sideways scroll) and on desktop, with text zoomed to 200%. Touch targets about 44px.
- Both light and dark themes look designed, not inverted.
- One obvious primary action per view. Secondary options collapsed.
- Color is never the only signal (pair it with text, an icon or a pattern).

The floor is built in, not announced: don't list it as a feature on the page.

## 5. Hand off to the review loop
Run the gui-review-loop skill on every screen and state you touched: desktop and phone, light and dark, with the
empty, loading and error states included. Look at the screenshots while you build too, not only at the end; a
picture shows what reading the code hides. Judge against `docs/checks/visual-review.md` and the plan above. Fix and
repeat until a full round finds nothing. Update the plan if the build changed a decision.

## 6. Record the decisions
In an app project, write the direction and the one memorable thing into the "Design direction" row of
`docs/foundation.md` section 3, and the token file's path into the "Design tokens" row. Note in `docs/DECISIONS.md`
what was tried and dropped, so the next design pass starts from it instead of repeating it.

## Done when
- [ ] Subject, audience and main job are written down, confirmed if they were guessed.
- [ ] A design plan exists (direction, color, type, space, layout options, first view, motion, the one memorable
      thing), and the generic parts were revised with a reason.
- [ ] All values live in tokens, with light and dark values, and contrast was checked for each text pair.
- [ ] Empty, loading, error and long-data states exist and say what to do next.
- [ ] The usability floor holds: keyboard, focus, labels, reduced motion, phone and desktop, zoom.
- [ ] The gui-review-loop ended with `Visual review: PASS after N rounds`.
- [ ] App projects: the "Design tokens" and "Design direction" rows in `docs/foundation.md` section 3 are filled.

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

More detail on each area: [references.md](references.md).

Inspired by "frontend-design" in anthropics/skills (Apache 2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
