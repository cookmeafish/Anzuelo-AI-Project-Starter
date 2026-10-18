# MCP builder references

## From request to jobs (worked method)
Turn the request into verbs on things, then keep only what a user would ask for.
| Request | Jobs | Shape |
|---|---|---|
| "a task list" | add, list, finish, delete a task | four tools; list is read-only, delete is destructive |
| "look up our product docs" | search the docs, read one page | a search tool plus a resource template `docs://{slug}` |
| "convert units" | convert a value | one tool, text result, no UI |
Two jobs that always run back to back become one tool. A selection or filter the user changes while looking at
results belongs inside the UI or the arguments, not in a tool of its own.

## Tool design checklist (one row per tool)
| Check | Pass when |
|---|---|
| Job | It maps to one job a user will ask for |
| Name | Starts with a verb, has the service prefix, unique across servers |
| Description | Says when to use it, what it returns, what it doesn't do, and any side effect; matches the code |
| Inputs | Every field typed and described with an example; enums for fixed sets; limits on numbers and strings |
| Identifiers | Accepts what users know, or a lookup tool exists |
| Output | Only the fields the next step needs; stable shape; output schema declared where supported |
| Size | Paged with limit and cursor; huge results truncated with a note saying so |
| Annotations | Read-only, destructive, idempotent and outside-reach set on purpose (see below) |
| Errors | Tool error with a message that names the fix; no stack traces, no internals, no silent empties |
| Safety | No path, shell or query built from raw input; secrets never in results or logs |

## Annotations
| Hint | Means | Protocol default when left out |
|---|---|---|
| read-only | changes nothing | false |
| destructive | may delete or overwrite (only meaningful when not read-only) | true |
| idempotent | the same call twice has no extra effect | false |
| open world | reaches systems outside the server's own data | true |
The defaults assume the worst, so set all four on every tool. A client may use them to decide when to ask the user,
but they are claims by the server, never a security boundary.

## Results
**Content types** a tool result can carry: plain text, structured JSON, Markdown, images, audio, other binary with a
MIME type, an embedded resource (a URI plus its content), or several of these in one result. Give the model text it
can read; add structured data for programs; send binary only when the client needs the file itself.

**Readable vs JSON.** When a format option makes sense, readable output shows dates in a human format, names with
their ids in parentheses, and leaves out bulky metadata. JSON output keeps every field with stable names and types.

**Paging.** Respect the caller's limit and default to a modest page (20 to 50 items). Return the items, the count,
whether more exist, and the cursor or offset for the next page; a total when it is cheap to get. Fetch page by page
from the source rather than loading everything and slicing.

**Truncation.** Cap the size of any single result. When you cut, say what was cut and how to get the rest (a filter,
the next page, a detail tool).

## Tool or resource or prompt
| The thing | Use |
|---|---|
| The model decides to do it, or it changes something | Tool |
| Read-only data addressed by a stable URI | Resource (template with `{param}` when it varies) |
| A message the user picks from a menu | Prompt |
| Data the model must search or filter | Tool (a resource can't take a query) |

## Resources and prompts
- Give every resource a name, a description and a MIME type (`application/json`, `text/markdown`).
- A template can carry several parameters (`org://{org}/team/{team}`) and nest (`user://{id}/posts/{post}`). A
  missing record is an error with a clear message, not an empty body.
- Static resources return fixed data; dynamic ones compute it on each read. Both stay read-only.
- Prompts take typed, described arguments and return the message text. Keep them short and specific.
- Offer completion (suggested values) for prompt arguments and template parameters when the set is known or
  searchable, such as language names or existing project names.

## Common URI schemes for resources
`config://settings`, `docs://<topic>`, `db://<table>/{id}`, `file://{path}` (confined to the allowed folders),
`<service>://<kind>/{id}`. Pick one scheme per service and keep it consistent.

## Interactive UI
Some clients can show a small interactive view that a tool returns. Use it only when those clients are the target
and the view clearly helps: browsing or comparing several items, charts, maps or images, or picking visually (dates,
seats, colors). Plain answers, conversions and status checks stay text.
- One view per flow. A list that opens into a detail is one view, not two tools with two views.
- Send the view everything it needs in the first result instead of fetching details call by call.
- The view keeps its own selections and filters. Use the host's persisted state for anything that must survive a
  reopen.
- Draw a loading state first: the view can appear before the tool finishes, with its data still empty.
- The model never sees the view. Return a short text summary next to it so the conversation can continue.
- Follow the host's light or dark theme, and test both (the gui-review-loop skill for the screenshots).
- Calls from the view back to other tools go through the same validation and annotations as any other call.

## Tests beyond the happy path
Inputs: valid, invalid, empty, oversized. Auth: missing, wrong, expired, for another server. Outside services: slow
(timeouts), failing, rate-limited. Load: several calls at once on an HTTP server. After every error: no leaked
handles or temporary files, and the next call still works.

## Agent task questions
Write about 10 questions that prove the server is usable, not just running.
1. **Inspect** the tool list and the docs. Explore the data with read-only calls only.
2. **Write the questions:**
   - **Read-only:** answering never changes data. Drop any question that would need a write.
   - **Realistic:** something a user would actually ask.
   - **Several steps:** needs 2 or more tool calls (find, then fetch, then compare); some may need paging or older
     records.
   - **Not a keyword lookup:** word the question with synonyms or descriptions, not the exact text of the record.
   - **Exercises the results:** answers that depend on ids, names, dates and links, so weak output shows up.
   - **One checkable answer:** a name, number, date, link or yes/no, compared as a string. State the format in the
     question ("Answer as YYYY-MM-DD"). Prefer readable values over opaque ids, vary the kind of answer, and avoid
     lists.
   - **Stable:** the answer won't change next week. Use closed or past data, never live counts.
   - **Independent:** each question stands alone.
3. **Solve each one yourself** through the server and record the answer. Fix or drop any question you can't answer
   with certainty.
4. **Run them** with an agent connected to the server. Record per question: right or wrong, the number of tool calls,
   the time taken, and the agent's own comments on the tools.

Keep the questions with their expected answers next to the server's tests (a JSON or XML file), and rerun them after
any change to names, descriptions or result shapes.

**When answers come back wrong:** read the agent's comments first, then check the descriptions, the input docs,
result size (too much or too little), and error messages. Many tool calls or timeouts usually mean results are too
large or paging is broken.

## The lint script
`node skills/mcp-builder/scripts/lint-tools.mjs <tools.json> [--prefix name]` reads a saved `tools/list` result (the
whole response, or just its `tools` array), checks each tool against the checklist rows that can be checked
mechanically, and prints one line per problem. Exit 0 = clean, 1 = problems, 2 = bad usage or the file could not be
read. It reads only the file you give it.
