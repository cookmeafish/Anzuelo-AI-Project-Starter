Inspired by the "data" plugin in https://github.com/anthropics/knowledge-work-plugins, found at `data/skills/`
(explore-data, validate-data, statistical-analysis, sql-queries, create-viz and build-dashboard). The plugin folder
carries its own Apache License 2.0 (`data/LICENSE`, copied here as LICENSE).

The originals are commands and reference sheets aimed at cloud warehouses, Python plotting and a dashboard built on a
charting library loaded from the web. Ours keeps the ideas in neutral terms for any agent: profile first, check
quality before trusting the data, pick summaries that fit the shape of the data, show uncertainty, check joins, draw
honest charts, and review before sharing. It works on local files with nothing to install, ties every number to the
project's tracing rule in the research skill, and adds our own zero-dependency profiler,
`skills/data-analysis/scripts/profile.mjs`. SQL engines and Python are optional. Edit freely; this is our version now.
