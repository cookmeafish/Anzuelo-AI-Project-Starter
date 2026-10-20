---
name: data-pipeline
description: Keeps a repeatable data pipeline trustworthy from raw input to reported number. Raw inputs stay untouched and logged, every input is checked against its schema before use (scripts/schema-check.mjs, nothing to install), a schema change is a recorded decision, runs are repeatable and write new outputs, and every reported total is reconciled against the raw data. Use when a project loads, cleans, transforms or totals files (CSV, TSV, JSON, exports, logs) again and again, on a schedule or per batch; when a new batch or export arrives for an existing pipeline; when a column, format or source changes; and when a pipeline total looks wrong. For a one-off question about a dataset use data-analysis.
triggers: data pipeline, etl, etl job, import job, nightly import, new batch of data, raw data folder, rerun the pipeline, re-run the pipeline, backfill, schema check, check the schema, validate the input, input schema, schema drift, column renamed, new column in the export, export format changed, reconcile the totals, totals don't match, totals do not match
---
# Data pipeline: from raw file to a number you can trace

A pipeline runs the same steps on every new batch, so one silent mistake repeats on every run. Each section closes
one way a wrong number gets in unnoticed.

Say at the start: "Running the data through the pipeline checks (data-pipeline skill)."

## What the other skills already cover
- **The line with data-analysis:** data-analysis answers a question about a dataset once (profile, quality,
  statistics, charts); this skill is for steps that run again on each new batch. A one-off look at a pipeline's
  output is data-analysis; a step that will run next week belongs here. Its profiler
  (`node skills/data-analysis/scripts/profile.mjs <file>`, when enabled) helps write a first schema from a sample.
- **Showing how each number was computed:** the data-analysis skill and its checks (data-computed,
  data-computed-trigger). This skill adds the reconciliation in **E**.
- **A database schema or migration:** the data-change runbook (app pack): backup, migration, restore. This skill
  covers file inputs and their schemas.
- **A new file dropped into the project for the knowledge base:** the ingest runbook (knowledge pack).
- **A step that crashes or gives a wrong total:** the debug skill finds the cause before any fix.
- **Personal data in the inputs:** the security-review skill.

The check is `skills/data-pipeline/scripts/schema-check.mjs` (Node only, read-only). The schema format is in the
comment at the top of the script.

## Pick the situation
| Situation | Do |
|---|---|
| Setting up a pipeline, or adopting one that exists | **A**, **B**, **D** |
| A new batch or export arrives | **A** (log it), **B** (check it), then run, then **E** |
| The check fails, or a column, type or unit changed | **C** |
| A rerun or a backfill of earlier periods | **D**, then **E** |
| A reported total looks wrong, or two totals disagree | **E**, then the debug skill |

## A. Raw inputs are evidence
1. Raw inputs land in one folder (`data/raw/` unless the project already has one) under a dated name:
   `<source>-YYYY-MM-DD.<ext>`. They are never edited, moved, renamed or overwritten. A corrected export from the
   source is a new file with a new date.
2. Protect the folder: add it to `protectedOriginals` in `tools/hooks/config.json`, so the hooks deny edits to it.
3. Log every arrival in one table outside the raw folder (for example `data/inputs-log.md`): date, file name, source,
   row count, and a checksum (`sha256sum <file>`, or `certutil -hashfile <file> SHA256` on Windows). The row count
   comes from a run, not from the file name or the sender's message.
4. A number that cannot be traced to a logged input is not reported.

## B. Check the schema before use
1. Write the schema once per source, next to the pipeline code (for example `data/schemas/orders.schema.json`):
   the columns, their types (`string`, `integer`, `number`, `boolean`, `date`, `datetime`), which are required or
   optional, allowed values (`enum`), ranges (`min`, `max`) and patterns, whether extra columns are allowed
   (`allowExtra`), a minimum row count (`minRows`), and the values that mean "missing" in this source (`missing`,
   default only empty).
2. Run it on every new input before any step reads it:
   ```
   node skills/data-pipeline/scripts/schema-check.mjs <input file> <schema file>
   ```
   It reads CSV, TSV (`--sep` for other separators), JSON arrays and JSON Lines, and prints each problem with its row
   count and first rows (`--max-examples N`, default 5), then `RESULT: PASS` or `RESULT: FAIL <why>` (exit code 1 on
   a fail, 2 on a usage error).
3. A fail stops the run. Never silently coerce a bad value to pass. Either the input is wrong (ask the source for a
   corrected export) or the schema changed (**C**).
4. Rows the pipeline rejects on purpose (a known bad record type) are counted and reported in each run's summary,
   never dropped without a count.
5. To make the check automatic, add a project check in `tools/hooks/requirements.json` with `toolPassed` and
   `selfRun` on changes to the raw folder (`docs/checks/runbook-standards.md`, "A good check").

## C. A schema change is a decision
A new, renamed or removed column, a changed type, unit, date format or code list:
1. Confirm it with the source (or the user) before changing anything. A column that vanished may be an export error.
2. Write a dated row in `docs/DECISIONS.md`: what changed, from which batch on, why, and which outputs it affects.
3. Update the schema file, then the code, then add a test fixture with one row in the new shape.
4. Rerun the check on the new input until it passes, and on one older input to see what still reads the old shape.
5. Earlier outputs made with the old shape stay as they are; say in the decision whether they need a backfill (**D**).

## D. Repeatable runs
1. One command runs the whole pipeline from raw inputs to outputs (a script in the project, for example
   `node data/run.mjs <batch>` or `python -m pipeline <batch>`). No manual steps in between.
2. The same inputs give the same outputs: sort before writing, fix the time zone, seed anything random, pin the tool
   versions (dependency-update skill).
3. Outputs are new files, dated or versioned (`data/out/orders-2026-03.csv`), never edits of earlier outputs. A
   backfill writes a new version and says which one replaces which.
4. Each transform has a test with a tiny fixture, including the rows real exports contain: blank values, duplicates,
   a header with no rows, a trailing newline, a byte order mark, another encoding, a quoted separator.
5. Each run prints a short summary: inputs with their row counts, rows rejected and why, outputs with their row counts.

## E. Reconcile every reported total
1. Before reporting a total, compute it a second way from the raw input: a sum straight from the raw file, row counts
   in against rows out plus rejected, or the previous period's total plus this period's rows.
2. Write both in the answer: `Reconciled: <total> from the output, <total> from the raw input, difference <n>`.
3. Rows in must equal rows out plus rows rejected, at every step that should not add or remove rows. A join that
   grows the row count is a bug until explained.
4. A mismatch is not reported as a result: find the cause first (debug skill), then rerun.

## Done when
- [ ] The schema check ran this turn on every pipeline input that changed (hook: pipeline-schema-checked).
- [ ] Raw inputs untouched and the new ones logged with row count and checksum (hook: protect-originals once the raw folder is in protectedOriginals; judgment: the log entry).
- [ ] A schema change has its dated `docs/DECISIONS.md` row, a schema update and a fixture (judgment: whether a change is a schema change needs a look at it).
- [ ] Every reported total has a `Reconciled:` line, and every number says how it was computed (hook: data-computed-trigger when data-analysis is enabled; judgment: the second method has to fit the data).

## Pitfalls
- Editing a raw file "just to fix one value" destroys the evidence. Write the correction as a rule in the code, logged.
- A check that only reads the header misses type, unit and date-format changes. The schema check reads every row.
- Coercing a bad value to zero or empty so the run finishes: the total looks fine and is wrong.
- Overwriting last month's output during a backfill, so nobody can compare the old number with the new one.
- Comparing totals from runs with different inputs, filters or time zones, and calling the gap a data error.
