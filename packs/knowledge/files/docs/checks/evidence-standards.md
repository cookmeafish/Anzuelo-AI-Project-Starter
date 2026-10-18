# Evidence standards

## Labels (use exactly these words. The hook looks for them.)
| Label | Means | Needs |
|---|---|---|
| observed | Seen directly in a file, photo or page | Which file or page |
| user reported | The user said it | The date; the fact in your own words |
| source verified | A reliable source states it | Link + retrieval date |
| document verified | An original or official document in `sources/` shows it | The file name (and page/section) |
| measured | Computed or measured | How, and from what |
| inferred | Reasoned from other facts | The reasoning, in one line |
| hypothesis | Plausible and untested | What would test it |
| assumption | Taken as true to proceed | Why, and what changes if it's wrong |
| unresolved | Unknown, or sources conflict | What would settle it |

## Rules
1. **Never invent.** No fabricated URLs, quotes, statistics, citations, product names, prices or dates. If you can't
   find it, say "not found" and label it unresolved.
2. **Primary first.** For rules, prices, specs, schedules and availability, use the official or original source.
   Forums, AI summaries and aggregators are leads, not proof.
3. **Date everything that can change.** Mark the knowledge file `volatile: yes` and re-check before relying on it
   (the audit warns when a volatile file's `checked:` date is over 90 days old, or its `next_check:` has passed).
4. **Scope matters.** A rule for one place, product, version or person isn't automatically a rule for another. Record
   what each fact applies to.
5. **Conflicts are data.** Keep both claims, label the fact unresolved, and say which you trust and why.
6. **Supersede, don't erase.** When a fact changes, move the old one to the file's History section with the date.
7. **Facts and interpretation stay apart.** "The photo shows a crack" (observed) is separate from "the foundation may be
   settling" (hypothesis).
8. **Privacy.** The user's private details stay local. Don't send them to web searches or external services unless the
   user agrees.
9. **Register sources** in `docs/knowledge/SOURCES.md`: type, reliability, retrieval date.
