# Always (the project's standing rules, checked every turn)

The project's own standing rules that belong to no single runbook. The end check reads this "Done when" list every
turn. Give each line one marker: `(file: a|b)`, `(ran: <regex>)`, `(answer: <regex>)`, `(prompt: <regex>)` or
`(tool: <regex>)`, and add `(when ...)` with any of those kinds when the rule fits only some turns (several must all
hold). A regex may not contain `)`. Example:
`- [ ] An offer to delete files names each path (when answer: OK to delete) (answer: \w+/\S+\.\w+)`.
The project-rule skill adds lines here; `node tools/always.mjs convert` moves old `requirements.json` checks here.

Related: [[user-requirements]], [[rule-enforcement]], [[runbook-standards]].

## Done when
