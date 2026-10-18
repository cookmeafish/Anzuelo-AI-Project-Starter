# Searching without a built-in web search

The agent's own search tool comes first. Use this when there is none, when it fails or is rate-limited, when the user
asks for DuckDuckGo, or as a second engine to cross-check: free web, news, image and video search through the `ddgs`
command, no API key needed.

## Is it available?
```bash
ddgs --help                                  # the command line tool
python -c "import ddgs; print(ddgs.__version__)"   # only if you plan to call it from Python
```
Check each place you will use it: the shell, a Python runtime and a code-running sandbox are different environments.
1. **The command works:** use it.
2. **It is missing and the user wants these results specifically:** ask before installing, then `pip install ddgs` in
   the environment that will run it, and check again. The old package name `duckduckgo-search` is out of date.
3. **It is missing otherwise:** use the agent's other web or browser tools. Don't install anything silently.

## Search
```bash
ddgs text   -q "standing desk weight limit" -m 5          # web pages
ddgs news   -q "electricity prices" -m 5 -t w             # news from the past week
ddgs images -q "ergonomic chair diagram" -m 5
ddgs videos -q "how to calibrate a monitor" -m 5
ddgs text   -q "..." -m 5 -t m -r uk-en -s moderate       # past month, one region, safe search level
```
For a script, use the helper: `node skills/research/scripts/search.mjs text "query" 5 --json` prints JSON, waits and
retries once when a search comes back empty, and never goes through a shell. `ddgs ... -o json` writes a file in the
current folder and prints nothing. From Python, pass the count by name: `DDGS().text("...", max_results=5)`.

Search returns titles, links and snippets, not pages: open the pages before using anything (SKILL.md §C).

**Throttling:** many fast searches get blocked. Pause a few seconds between searches; empty results usually mean
throttling or a weak query. Still empty: say so and switch tools. Results change between runs: note the date.

# Reference

Checked against the ddgs command line source (version 9.16). Flags and fields can change between versions; run
`ddgs <type> --help` when something here doesn't match.

## Which search type for which question
| Type | Good for | Fields you get back |
|---|---|---|
| `text` | general facts, documentation, organizations, products | `title`, `href` (the link), `body` (snippet) |
| `news` | recent events and announcements | `date`, `title`, `body`, `url`, `source`, `image` |
| `images` | diagrams, photos, visual references | `title`, `image` (full size), `thumbnail`, `url` (the page), `width`, `height`, `source` |
| `videos` | tutorials, talks, demos | `title`, `content` (the link), `description`, `duration`, `provider`, `published`, `uploader`, `statistics` |

The link field has a different name per type (`href`, `url`, `content`). Read every field except the main ones as
optional.

## Flags
| Flag | What it does | Values |
|---|---|---|
| `-q` | the query (required) | text |
| `-m` | how many results | a number, default 10 |
| `-t` | how recent | `d` = past day, `w` = past week, `m` = past month, `y` = past year (videos: no `y`) |
| `-r` | region and language | e.g. `us-en`, `uk-en`, `de-de`; default `us-en` |
| `-s` | safe search | `on`, `moderate` (default), `off` |
| `-p` | page of results | a number, default 1 |
| `-b` | which engines to ask (text) | `auto` (default) or a named engine; newer versions search several engines, not only DuckDuckGo |
| `-o` | save to a file instead of printing | `json`, `csv`, or `name.json` / `name.csv` |
| `-nc` | no color in the printed output | flag |

Images also take `-size`, `-type`, `-l` (layout), color and license filters. Videos take `-res`, `-d` (duration)
and `-lic`.

## Python
```python
import ddgs
with ddgs.DDGS() as client:
    for r in client.text("query", max_results=5):          # also .news .images .videos
        print(r.get("title"), r.get("href"), (r.get("body") or "")[:200])
```
Use Python only after the import check in SKILL.md passed in that same runtime. `max_results` is keyword-only on every
method.

## Troubleshooting
| What you see | Likely cause | Fix |
|---|---|---|
| `ddgs: command not found` | not installed in this shell | ask the user, or use the agent's other web tools |
| `ModuleNotFoundError: No module named 'ddgs'` | that Python runtime lacks it | use the command line tool, or prepare that runtime with the user's OK |
| the shell works, the code sandbox fails | they are separate environments | keep using the shell |
| no results | throttling, a blocked network, or a weak query | wait a few seconds, rephrase, then try another tool |
| `-o json` printed nothing | it saved a file in the current folder | use `skills/research/scripts/search.mjs --json`, and delete the stray file |
| a positional-argument error in Python | the count was passed by position | pass `max_results=` by name |
| `KeyError` on a field | fields vary by result and version | use `.get()` |

## The helper script
`skills/research/scripts/search.mjs <text|news|images|videos> "<query>" [count] [--json] [-t d|w|m|y] [-r region]`
- Checks that `ddgs` exists and says what to do when it doesn't (it never installs anything).
- Passes the query as an argument, not through a shell, so quotes and symbols in a query are safe.
- Saves to a temporary file, reads it, prints the results, and deletes the file.
- When a search comes back empty it waits a few seconds and tries once more, then reports "no results".
- Exit codes: 0 results found, 1 no results, 2 bad usage or ddgs missing.
