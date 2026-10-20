---
name: data-analysis
description: Works with tables of data (CSV, TSV, JSON, spreadsheets exported to CSV, SQLite or DuckDB files) from first look to a shareable result. Profiles a new dataset, checks its quality before trusting it, answers questions with numbers using sound statistics and stated uncertainty, queries with SQL when a database tool is installed, makes honest charts and static dashboards, and traces every number to the data before sharing. Use when the user hands over a data file, asks what is in a dataset, asks a question that needs counting, averaging, comparing or trends, or wants a chart, table or dashboard.
triggers: analyze this data, analyse this data, data analysis, dataset, csv file, spreadsheet data, profile the data, explore the data, data quality, clean the data, statistics, average of, median, correlation, trend in, sql query, duckdb, sqlite, make a chart, chart of, plot the, data dashboard
---
# Data analysis: numbers you can stand behind

A wrong number looks exactly like a right one. So every figure in the answer comes from a computation run this turn on
the actual data, and the reader can see how.

Say at the start: "Working through the data (data-analysis skill)."

## What the other skills already cover
- **Tracing facts and numbers:** the research skill, section D, and its check (REQ: answer-traced). Every number in the
  answer must appear in something read or computed this turn. This skill adds how to produce numbers that pass. Read
  `skills/research/SKILL.md` if you have not this session.
- **The written report or one-pager:** the deliverable runbook (knowledge pack). This skill produces the numbers and
  charts that go into it.
- **Looks of a page or dashboard:** the frontend-design skill, when enabled.
- **A script that crashes or gives odd output:** the debug skill.

Methods, formulas and reading are in [references.md](references.md). The profiler is
`skills/data-analysis/scripts/profile.mjs` (Node only, nothing to install).

## Pick the situation
| Situation | Do |
|---|---|
| A file or table you have not looked at yet | **A**, then **B** |
| About to base a conclusion on data from somewhere else | **B** |
| A question whose answer is a number, a comparison or a trend | **C** (after A and B for a new file) |
| The data is in a database, or is too big or too joined for a quick script | **D** |
| A chart, a table for a report, or a dashboard | **E** |
| Anything leaving the session: an answer, a file, a chart | **F**, always |

## A. Profile a new dataset
1. Keep the original untouched. Work on a copy in `.cache/data/` or read it in place; never edit the source file.
2. Run `node skills/data-analysis/scripts/profile.mjs <file>` (`--sep ;` to force a separator, `--top N` for more
   common values). It reads CSV, TSV, JSON and JSON Lines and prints rows, columns, duplicate rows, rows with the wrong
   number of fields, and per column: a type guess, missing and placeholder-like values, distinct count, number ranges
   with mean, median and an outlier count, date ranges, and the most common values. Excel files: export to CSV first,
   or ask the user to.
3. Write down the **grain**: what one row stands for (one order, one customer per day, one survey reply). Most wrong
   totals come from a wrong idea of the grain.
4. Note what looks off before analysing anything: a column typed as text that should be numbers, an ID that repeats, a
   date column with two formats, a maximum far above the median.
5. Tell the user in a few lines: size, grain, the columns that matter for their question, and the problems found.

## B. Check quality before trusting it
Write each problem with how many rows it affects:
- **Complete:** missing values in the columns the question needs. Placeholders such as `NA`, `0`, `999` or `unknown`
  standing in for missing. Gaps in a date series. Groups that should be there and are not.
- **Unique:** duplicate rows, and duplicates of what should be a key.
- **Valid:** values in a possible range (no negative ages, no percentages over 100, no dates in the future for past
  events). Units consistent within a column.
- **Consistent:** one spelling per category (`North`, `north`, ` North`). One date format. Totals that match their
  parts.
- **Current and in scope:** the date range, place and population the user's question is about.
- **Who is missing:** rows that never made it into the file (people who left, failed orders, non-responders). Say how
  that could bend the result.

Fix only what is clearly an error, on the copy, and log every change (what, how many rows, why). Ask before dropping
data that might be real. A problem that changes the answer goes in the answer.

## C. Answer a question with numbers
1. **Restate the question as a computation:** the measure, the group, the filter, the period. "Average order value per
   region in Q1 2025, excluding refunds." Agree on definitions that could go two ways.
2. **Compute with code, never in your head.** Use a Node script, SQL (**D**), or Python if already installed. Keep the
   script in `.cache/data/` so it can be re-run. Mental arithmetic and "about" figures are not traced numbers.
3. **Pick the right summary:**
   - Skewed values (money, durations, counts per user): give the median next to the mean; the gap shows the skew.
   - Rates and shares: state the denominator ("12% of 3,400 orders"). Compute rates from raw counts, never by averaging
     averages from groups of different sizes.
   - Changes: compare equal, complete periods. Give the absolute change and the percentage.
4. **Show uncertainty.** A small group, a sample, or a noisy series gets a range, not a single sharp number: a
   confidence interval, a bootstrap range, or at least the count behind each figure. Round to the precision the data
   supports.
5. **Before claiming a difference is real,** check it is larger than the noise (a test or interval that fits the data,
   see [references.md](references.md)) and large enough to matter. Say how many comparisons you tried; the more you
   try, the more chance hits you find.
6. **Say what it does not show.** A correlation is not a cause. A pattern in groups may not hold for individuals. A
   total can reverse inside every subgroup (check the main split). Outliers: investigate, then keep, fix or report
   separately, and say which.
7. **Label your own work.** Anything you computed says so on its line, as the research skill asks: "(calculated:
   median of `amount`, 3,212 rows, refunds excluded)".

## D. Query with SQL
Check what is installed first (`duckdb --version`, `sqlite3 --version`). Both are optional (cost and install lines in
`docs/recommended-tools.md`); ask before installing anything. Without either, use a Node script.
- **DuckDB** queries CSV, JSON and Parquet files in place: `SELECT region, count(*) FROM 'data.csv' GROUP BY 1`.
- **SQLite** for data that should live in one database file. sqlite-utils (optional) loads a CSV into it in one step.
- Open source data read-only. Write query results to `.cache/data/`, not over the input.
- Check row counts before and after every join; a count that grows means the join matched more than one row per key.
- Count distinct keys when counting things through a join.
- Keep each query that produced a number in the run script or the answer, so the number can be traced to it.

## E. Charts and dashboards
Default to a static file that opens in any browser with nothing installed: one HTML page with inline SVG, data in the
page, no external scripts. A PNG or a plotting library is fine when the user already uses one.
- **Choose by question:** change over time is a line; comparing categories is a bar sorted by value; parts of a whole
  with few parts is a stacked bar; two measures together is a scatter plot. Avoid pies with many slices and 3D.
- **Honest axes:** bars start at zero. A line chart may zoom in, but the axis must show it. No broken axis without a
  clear mark. Panels being compared share a scale.
- **Labels:** a title that states the finding ("Returns doubled after March"), axis titles with units, the data's date
  range and source in a caption. Label lines directly instead of making the reader match a legend.
- **Accessible color:** a palette that colorblind readers can tell apart, enough contrast with the background, and
  never color alone to carry meaning (add labels, patterns or position). One highlight color for the point that
  matters, gray for context.
- **Dashboards:** the few headline numbers first, each with its period and comparison, then the charts that explain
  them, then a table of detail. Every number on it is computed by the same script that writes the page.
- Open the page and look at it before handing it over (gui pack: gui-review-loop skill, when installed).

## F. Before sharing
1. **Re-run from scratch:** the profile, the cleaning steps and the analysis script, from the original file. The
   numbers must come out the same.
2. **Trace every number** in the answer, chart or file to a line of output from this turn. A number with no output
   behind it is removed or marked "(not verified)" (research skill, section D).
3. **Cross-check one or two figures another way:** a different query, a hand count on a small filter, parts adding up
   to the total.
4. **State the limits:** data source and date, rows excluded and why, assumptions, and what would change the answer.
5. In the answer, lead with the result, then a short `How it was computed:` line naming the script or query and the
   row count it ran on.

## Done when
- [ ] New data was profiled and its grain stated (**A**), and quality problems listed with row counts (**B**) (judgment: the grain and the quality problems need a reader).
- [ ] Every number in the answer came from code run this turn, with a `How it was computed:` line (hook: data-computed).
- [ ] Charts have honest axes, titles, units, source and accessible colors (**E**) (judgment: honest axes and colors need a human eye).
- [ ] The analysis was re-run from the original before sharing (**F**) (judgment: no check sees the re-run yet).
- [ ] Numbers computed from data files say how they were computed, even unasked (hook: data-computed-trigger).

## Pitfalls
- Summarising a column the profiler typed as text: some values are not numbers, and they were silently dropped.
- Averages of averages, partial periods compared with full ones, and definitions that changed between periods.
- Treating the absence of a row as zero, or zero as missing.
- A join that doubles rows, then a total that looks plausible.
- Reporting the one segment that showed an effect out of twenty that were tried.
- More decimals than the data can support.

Section ideas were inspired by the "data" plugin in anthropics/knowledge-work-plugins (Apache-2.0, see LICENSE and
[SOURCE.md](SOURCE.md)); the text and the script are our own.
