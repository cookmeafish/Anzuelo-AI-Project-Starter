Inspired by the caveman project by Julius Brussee, https://github.com/JuliusBrussee/caveman (checked 2026-10-18). The
main sources are its "caveman-compress" skill (shortening memory files with a validator) and its "caveman" and
"ultracave" skills (the terse reply voice at two strengths). Ideas also came from its "cavecrew" skill and agents
(compact sub-agent reports), "megacave" and "caveman-stats".

License: the whole repository is under the Apache License 2.0 from Caveman 3.0.0 on (its `LICENSING.md`); earlier
releases were split between MIT and the Business Source License. Apache 2.0 allows commercial use, changes and
redistribution, as long as the license and notices travel with the work. `LICENSE-caveman` is a verbatim copy of its
license; `LICENSE` is the same text, kept under the name the project's tools expect. The upstream `NOTICE` reads, in
the part that applies here: "Caveman. Copyright 2026 Julius Brussee." The rest of that notice covers code in its
engine, browser and binaries, none of which is used here. "Caveman" is the author's trademark, so this skill has a
neutral name and is not endorsed by him.

What we changed:
- All text is rewritten in our words and house style. No sentence is copied (checked with `tools/skills.mjs compare`).
- Three modes by situation: AI-facing files, text only agents read, and replies to the user only when the user opts
  in. The original voice is on for chat by default; ours stays off, because the project's writing standards keep
  user-facing text plain.
- Three levels named light, full and ultra, mapped to where each is allowed. Sub-agent briefs are held at light
  because research on compressed prompts (the CAVEWOMAN paper, cited in `references.md`) found worse answers.
- The never-change list is extended for this project: file and folder names, `docs/names.json` names and name
  markers, check tags and markers, headings that other files link to, list numbering, quotes, and conditions as well
  as negations.
- The rewrite happens in the current agent session. The original sends the file to a model provider through its
  Python scripts. We dropped that, and with it the provider settings and retry calls.
- Its Python validator is replaced by our own zero-dependency Node scripts: `scripts/protect-check.mjs` (every
  protected token, negations per paragraph, for any text) and `scripts/compress-guard.mjs` (which files qualify,
  verified backups in `.cache/compress/`, file-level checks, restore). The file check reuses the protect check.
- Kept from its safeguards: refusing secret-looking files, frontmatter and code kept verbatim, no output that is not
  shorter, no leaked commentary, repairs that fix only the listed errors, restore after repeated failure, and full
  sentences for warnings, irreversible steps and questions.
- The honest-numbers point is kept: sizes are measured, savings are not claimed. Its session statistics depend on
  that plugin's hooks, so they are left out.
- Left out: the Classical Chinese mode, because answers must stay plain readable English; the proxy, tool-output
  shrinking, browser and cloud parts; and the plugin manifest and install files.

Edit freely; this is our version now.
