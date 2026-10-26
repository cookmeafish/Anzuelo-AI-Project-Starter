# Visual review checklist (every screenshot, every round)

Look at each screenshot as a first-time user would, then as a picky designer. Write down every problem before fixing
anything. A round "finds nothing" only when every item below holds on every screenshot.

## Breakage
- [ ] Nothing overlaps, is cut off, or spills outside its box. Long words and numbers wrap or truncate cleanly.
- [ ] No sideways scrolling at phone width. The tool's WARN lines catch the measurable cases.
- [ ] No broken images, missing icons, "undefined", "NaN", "[object Object]", raw JSON, stack traces or placeholder text.
- [ ] No console errors (tool WARN lines). Empty, loading and error states look intentional and say what to do next.

## Clarity
- [ ] The main action is obvious within 3 seconds. There is one primary button per view.
- [ ] Plain words: no file paths, flags, internal names or jargon in the main UI. Jargon has a tooltip or is hidden under "Advanced".
- [ ] Not too much at once. Secondary options are collapsed, and headers show the current choice.
- [ ] Labels match what things do, and the same thing has the same name everywhere.

## Craft
- [ ] Consistent spacing, alignment, sizes, corner radius and button styles. Nothing looks unaligned by a few pixels.
- [ ] Clear hierarchy: titles, sections and body text are visibly different. Line length is readable.
- [ ] Both themes look designed. Nothing is invisible in dark mode (dark text on a dark background, light borders on white).
- [ ] Contrast is readable (WCAG AA). Focus states are visible for keyboard users.
- [ ] Touch targets are big enough on phone (about 44px). Nothing important hides off-screen.

## Data
- [ ] Shown values are the real ones (spot-check one against the source). Units, dates and currency are formatted.
- [ ] Long lists, long names and empty data were tried, not just the happy path.

## Verdict per round
`Round N: <what you saw> → <what you fixed>`. Finish with `Visual review: PASS after N rounds`, or, only after 10 rounds,
`Visual review: STOPPED after N rounds - remaining: <list>`.
