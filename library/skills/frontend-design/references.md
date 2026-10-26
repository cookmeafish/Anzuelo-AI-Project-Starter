# Frontend design references

## Signs of a default instead of a choice
These looks are fine when the brief asks for them. They are a problem when they appear whatever the subject:
- A warm off-white page with a high-contrast serif and one earthy accent, or a near-black page with one neon accent.
- The colors of the AI tool you are working in, carried into the user's product.
- A newspaper imitation: thin rules everywhere, square corners, tight multi-column text.
- Everything chopped into identical rounded cards with the same radius and the same soft shadow.
- Gradient washes and glows used as decoration rather than to show something.
- The same chrome on every heading: a small all-caps label above it, a number before it, an arrow after the link.
- Meta lines joined by dots, monospace used for small labels by habit, big-number-plus-tiny-label hero stats.
- Labels made of a word, a spaced dash and a fragment; a tinted almost-black where plain black or a real color was
  meant.
- Fade-and-slide entrances on every section and hover lifts on every card.

Test: write down what you would make for a similar but different request. Where the two plans match, you defaulted.
Lean on what you do well, but treat each project as a chance to try one thing you haven't.

## Color
- Start from roles, not swatches: background, surface, raised surface, text, muted text, border, accent, success,
  warning, danger, focus ring.
- Dark theme: not an inversion. Lift surfaces with lighter steps instead of shadows, lower the saturation of accents,
  avoid pure white body text on pure black, and recheck every contrast pair.
- Keep accent use scarce so it keeps its meaning (the primary action, the current item, the thing that changed).
- Check contrast with a tool, not by eye. Include text on images and on tinted surfaces.

## Typography
- One family can carry a whole interface with weight and size alone. A second family must be clearly different.
- Use a modular scale (for example each step about 1.2 to 1.33 times the last) and a few weights, not many.
- Body line height about 1.4 to 1.6. Serif body text needs a little more than sans.
- Headings tighter than body. Large display text often needs slightly tighter letter spacing.
- Numbers in tables: tabular figures, right aligned, consistent decimals and units.
- Make sure the chosen fonts cover the languages the product ships in.

## Layout and space
- A spacing scale (for example 4, 8, 12, 16, 24, 32, 48, 64) and nothing in between.
- Hierarchy through size, weight, space and position before borders and boxes.
- Decide alignment on purpose. Left-aligned text is easiest to read in most languages.
- Design phone first when users are mostly on phones, desktop first when they are mostly at desks, and check both.
- Respect safe areas on mobile and window resizing on desktop.

## Motion
- Durations: small feedback about 100 to 200 ms, larger moves about 200 to 400 ms. Ease out when entering, ease in
  when leaving.
- Motion should explain: where a panel came from, what was added, what was saved.
- With reduced motion requested, replace movement with an instant change or a short fade.

## Writing in the interface
- Decide what each screen must say first, then write the least that says it.
- Name things by the user's task, not the system's parts (people manage alerts; they don't configure endpoints).
- Plain description over promotion. Specific over clever, especially for someone new.
- Active voice. A button names its result, and the confirmation repeats that verb ("Publish" leads to "Published").
- One term per concept, everywhere. Consistent words are how people learn their way around.
- Errors: what happened and the way out, in the product's voice, never a person's apology or a vague "something
  went wrong".
- Empty screens invite the first action instead of setting a mood.
- Sentence case, conversational, no filler, tone matched to the audience and the brand.

## Styles that stay clean
- Spacing between sections set in one place (the layout, or the section, not both).
- Avoid mixing a broad class selector and a narrow one for the same property; one silently wins and the other looks
  broken.
- One source per value: tokens for values, components for structure.

## States checklist
| State | It should |
|---|---|
| First run / empty | Say what this place is for and offer the first action |
| Loading | Keep the layout stable, show a skeleton or progress, allow cancel when slow |
| Error | Say what happened in plain words, keep the user's input, offer a retry or fix |
| Partial / long data | Wrap or truncate cleanly, paginate or virtualize long lists |
| Disabled | Say why, or hide it if it is never usable here |
| Success | Confirm with the same verb as the action, then get out of the way |

## Accessibility quick list
- Contrast WCAG AA. Focus always visible. Logical tab order. Skip link on long pages.
- Every control has an accessible name. Images have alt text, or empty alt when decorative.
- Text scales to 200% without loss. Touch targets about 44px with space between them.
- Don't rely on hover alone: touch screens have none.
