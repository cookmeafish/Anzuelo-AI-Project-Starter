Inspired by the "gitnexus-explorer" skill in https://github.com/NousResearch/hermes-agent (MIT License, copyright
Nous Research; see LICENSE).

What we changed:
- It no longer depends on one graph tool, web viewer or tunnel. It uses whatever is available: an optional code-graph
  tool, language tooling, ripgrep and git history.
- It adds traced flows, git hot spots and a "where to change what" table.
- It saves the map to `docs/codebase-map.md`, so later sessions reuse it.

Some general code-graph ideas came from the README of https://github.com/abhigyanpatwari/GitNexus, the tool the
original skill serves: functional areas, blast radius, symbol views, edge confidence and keeping indexes local. That
project uses the PolyForm Noncommercial license, so none of its text or code is used here.

Edit freely; this is our version now.
