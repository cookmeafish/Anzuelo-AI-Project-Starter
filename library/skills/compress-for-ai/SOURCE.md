Inspired by the caveman plugin in https://github.com/JuliusBrussee/caveman, found at `plugins/caveman/`. The main
source is its "caveman-compress" skill. Ideas also came from its "caveman", "ultracave", "cavecrew" and
"caveman-stats" skills and its three cavecrew agents. The repository uses the Apache License 2.0 for the whole
repository (see LICENSE); older releases were MIT. The author is Julius Brussee. "Caveman" is his trademark, so our
skill has a neutral name.

What we changed:
- All text is rewritten in our words and house style. The rules for what to cut, keep and never change are kept and
  extended for this project: REQ tags, waivers, checklist items, triggers and tool-read tables.
- The rewrite happens in the current agent session. The original sends the file to a model provider (a CLI, an API
  or a local server) through its Python scripts. We dropped that, and with it the provider settings, file locks,
  output caps and retry calls, because nothing needs to leave the session.
- Its Python checker is replaced by our own Node script, `skills/compress-for-ai/scripts/compress-guard.mjs`. It plans
  which files qualify, keeps verified backups in `.cache/compress/`, compares before and after, and restores.
- New: the split between AI-facing and user-facing files, protected and generated files that are never touched, two
  levels (tight and dense), checks for numbers, REQ tags, checklists, tables, negations and em dashes, and the project
  checks after a rewrite.
- Kept from its safeguards: refusing secret-looking files, empty files and invalid UTF-8; frontmatter and code kept
  verbatim; no output that is not shorter; no wrapping fence or leaked commentary; repairs that fix only the listed
  errors; restore after repeated failure.
- The "caveman" answer voice became the terse-answers option, but in plain English, because our writing standards
  require readable answers. Its rules for when to switch back to full sentences are kept.
- The cavecrew idea became one paragraph on compact sub-agent reports.
- The honest-numbers point of "caveman-stats" is kept: sizes are measured, savings are not claimed. Its session
  statistics depend on that plugin's own hooks, so they are left out.
- Left out: the Classical Chinese mode ("megacave"), because answers must stay plain readable English, and the plugin
  manifest, icons and host settings, which only serve installing the original.

Edit freely; this is our version now.
