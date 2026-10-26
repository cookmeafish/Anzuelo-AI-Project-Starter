Inspired by the "V3 Security Overhaul" skill in https://github.com/ruvnet/RuView (MIT License, copyright rUv; see
LICENSE), with context from the security-architect and security-auditor agent files it uses (`.claude/agents/v3/`).

What we changed:
- Stages that fit any stack (threat model, inventory, risk ranking, secrets, dependencies, input handling, sign-in and
  permissions, transport, logging, safe defaults) replace the product-specific issues, agent roster and code snippets.
- Every fix needs a regression test, and repeated patterns become automatic checks.
- It starts from the findings of the core security-review skill and keeps the baseline current (docs/security.md,
  plus docs/foundation.md in app projects).

Edit freely; this is our version now.
