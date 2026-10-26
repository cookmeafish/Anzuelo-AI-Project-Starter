Inspired by the "mcp-builder" skill found in https://github.com/Shubhamsaboo/awesome-llm-apps (folder
`generative_ui_agents/ai-mcp-app-builder/apps/mcp-use-server/.agent/skills/mcp-builder`). That folder is a copy of
the "mcp-builder" skill in https://github.com/mcp-use/mcp-use (`skills/mcp-builder`).

The skill folder has its own license, the Apache License 2.0 (see LICENSE). It applies instead of either repository's
root license. The license file names no copyright holder, so the credit goes to the mcp-use project and its
contributors.

Further ideas, but no text, came from the "mcp-builder" skill in https://github.com/anthropics/skills
(`skills/mcp-builder` and its reference files; Apache License 2.0 in that folder, copyright Anthropic).

What we changed:
- It works for any language and the official MCP SDKs, not one TypeScript framework and its UI widgets.
- It adds tool design rules: results sized for the next step, paging, annotations, and errors that say how to fix them.
- It adds a security section tied to the app pack's foundation and app standards.
- It tests through an inspector and real agent tasks, as the QA standards require. The upstream evals became the
  agent-task method in references.md.

Edit freely; this is our version now.
