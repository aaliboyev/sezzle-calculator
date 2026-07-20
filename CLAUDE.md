# sezzle-calculator

Full-stack calculator: Go REST backend in `backend/`, React + TypeScript frontend in `frontend/`. Priorities: correctness, clarity, maintainability — over extra features.

## Rules

- **Go budget: 2000 lines maximum**, everything handwritten counts. Generated artifacts (OpenAPI spec, JSON fixtures) are excluded. Features bend to the budget, not the other way around.
- **Comments are rare.** 1–3 lines of *why*, only where the code cannot say it. Never narrate what the next line does. No changelog or history comments.
- **Names are direct.** A function name minimally describes what its body does; a variable name says what it holds. No abstract or decorative words in identifiers.
- **Errors are clean.** API errors are structured JSON with a specific message and the correct HTTP status. Internals (stack traces, Go error chains) never reach the client. In Go, wrap with context at the point of failure, handle once — no log-and-return.
- **Everything is tested.** Both layers, with coverage reports. Edge cases are first-class: division by zero, overflow, NaN/Inf, float precision, malformed JSON, wrong types, empty input.
- **Configuration goes through env.** Ports, addresses, and flags come from `.env` (see `.env.example`) — never hardcoded in code or tool configs.
- **Commits are minimal and specific.** Subject ≤ 72 chars; body only when the *why* isn't in the diff. Technical tone, no marketing.
- **Docs answer "how to do it" or "why it's done this way"** — never restate what the code already says. Plain words throughout.
