Inspired by the Marketing plugin by Anthropic (Apache-2.0, see LICENSE), skills: brand-review, campaign-plan,
competitive-brief, content-creation, draft-content, email-sequence, performance-report and seo-audit. Version used:
1.2.0. The plugin's README.md and CONNECTORS.md were read for context.

The original is eight separate skills, wired to specific connectors (chat, design, marketing automation, analytics,
knowledge base, SEO and email tools) and a local settings file for the brand voice.

Ours merges them into one skill with one section per situation:

| Section | Covers the original skills |
|---|---|
| A. Review against the brand | brand-review |
| B. Plan a campaign | campaign-plan |
| C1. Draft a piece | draft-content, content-creation (the two overlapped almost fully) |
| C2. Draft an email sequence | email-sequence |
| D. Competitor brief | competitive-brief |
| E. Performance report | performance-report |
| F. SEO audit | seo-audit |

What ours keeps:
- the brand voice file idea, voice attributes with "means" and "doesn't mean", and tone that shifts while the voice
  stays;
- the claim checks on every review;
- the campaign chain from goal to audience, message, channel and measure, with a calendar built backward;
- structures per content type, sequence shapes with branches and exits;
- competitor frameworks and the battlecard;
- the report layout with recommendations by impact and effort;
- the SEO audit modes and the quick-win and bigger-work split.

What ours changes:
- Competitor research and every claim go through the project's research skill: sourced, screened, dated. The
  original's own research method is replaced by a pointer to it.
- The original's industry benchmarks (open rates, budget shares, production times, per-platform lengths) are dropped:
  they were unsourced and vary by sector and year. Targets come from the user's own history or sourced figures, and
  invented numbers become visible placeholders.
- No dependency on any connector, MCP server, chat tool or CRM. Connections are optional and the answer names what
  was used.
- The brand voice lives in `docs/brand-voice.md`, names in `docs/names.json`. Publishing, posting, scheduling and
  sending follow AGENTS.md rule 6 (explicit OK first). Flagged claims can go to the legal-review skill when enabled.
- Written fresh in the project's plain style, agent-neutral. Dropped: slash-command syntax, product-specific tool
  names, and the closing menus of follow-up offers.

Edit freely; this is our version now.
