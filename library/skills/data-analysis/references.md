# Data analysis: methods and reading

Each row names a step in [SKILL.md](SKILL.md), the method behind it, and where to read more. Summaries are in our own
words. Check the original before quoting it.

## Methods by step
| Step in the skill | Method | Read more |
|---|---|---|
| A. Grain, one table per kind of thing | **Tidy data.** Each variable is a column, each observation is a row, and each kind of observational unit is its own table. Messy files are usually one of a few patterns (values stored as column headers, several variables in one column) and can be reshaped. | Wickham (2014), "Tidy Data", *Journal of Statistical Software* 59(10). [Article](https://www.jstatsoft.org/article/view/v059i10) |
| A. Outlier count in the profiler | **Box plot fences.** Values below Q1 minus 1.5 times the interquartile range, or above Q3 plus 1.5 times it, are flagged as possible outliers. A flag is a reason to look, not a reason to delete. | NIST/SEMATECH e-Handbook of Statistical Methods, "What are outliers in the data?". [Page](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) |
| A. Reading CSV | **CSV format.** Fields that contain the separator, a quote or a line break are wrapped in double quotes, and a quote inside is written twice. The profiler follows this. | RFC 4180. [Text](https://www.rfc-editor.org/rfc/rfc4180) |
| C. Range for a share or rate | **Interval for a proportion.** The textbook "plus or minus 1.96 standard errors" interval behaves badly for small counts or shares near 0% or 100%. The Wilson score interval holds up better there. | [Overview of binomial confidence intervals](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval) |
| C. Range for anything else | **Bootstrap.** Resample the rows with replacement many times, recompute the statistic each time, and take the middle 95% of the results as a rough interval. Easy to script in Node; weak for very small samples. | [Overview of bootstrapping](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) |
| C. Is the difference real | **p-values in context.** A p-value does not measure the size or importance of an effect, and a cutoff like 0.05 alone should not decide a conclusion. Report the effect size and its interval with it. | American Statistical Association (2016), statement on p-values. [PDF](https://www.amstat.org/asa/files/pdfs/p-valuestatements.pdf) |
| C. Many comparisons | **Multiple comparisons.** Each extra test raises the chance of a false hit. Say how many were run, or tighten the threshold (for example, divide it by the number of tests). | [Overview](https://en.wikipedia.org/wiki/Multiple_comparisons_problem) |
| C. Check the main split | **Simpson's paradox.** A trend in the combined data can reverse inside every subgroup when the groups differ in size or mix. | [Overview with worked examples](https://en.wikipedia.org/wiki/Simpson%27s_paradox) |
| D. SQL over files | **DuckDB** reads CSV files directly in a query and guesses column types and separators. **SQLite** has a command-line shell that imports CSV into a table. Both are optional. | [DuckDB CSV docs](https://duckdb.org/docs/stable/data/csv/overview), [SQLite shell](https://sqlite.org/cli.html), `docs/recommended-tools.md` |
| E. Colors | **Colorblind-safe palette.** The Okabe and Ito set of eight colors stays distinguishable for the common forms of color blindness. | Okabe and Ito, "Color Universal Design". [Page](https://jfly.uni-koeln.de/color/) |
| E. Contrast | **Non-text contrast.** Parts of a chart needed to understand it should reach a contrast ratio of at least 3:1 against what is next to them. | WCAG 2.1, success criterion 1.4.11. [Understanding page](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) |
| E. Not color alone | **Use of color.** Color should not be the only way information is shown; add text, shape or position. | WCAG 2.1, success criterion 1.4.1. [Understanding page](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) |

## Formulas worth keeping at hand
- **Wilson interval** for `k` successes out of `n`, with `z = 1.96` for about 95%:
  center `(k + z²/2) / (n + z²)`, half-width `z * sqrt(k(n - k)/n + z²/4) / (n + z²)`.
- **Weighted mean of group means:** `sum(n_i * mean_i) / sum(n_i)`. The plain mean of the group means is only right
  when every group has the same size.
- **Percent change:** `(new - old) / old`. Give the absolute change next to it; a large percentage of a small base
  misleads.

## Optional tools
None of these is required. Each is listed with its cost and install line in `docs/recommended-tools.md`; ask the user
before installing.
- DuckDB: SQL straight over CSV, JSON and Parquet.
- SQLite and sqlite-utils: a single-file database, and a loader that builds tables from CSV or JSON.
- csvkit: small command-line tools to look at, filter and convert CSV.
- Python with pandas: use it only if it is already installed and the user works in Python. It is not in the
  recommended-tools list.
