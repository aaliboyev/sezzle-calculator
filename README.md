# sezzle-calculator

Full-stack calculator. Go REST backend evaluates arithmetic expressions; React + TypeScript frontend is a single dark-themed screen with one large expression input and an optional keypad animated via the View Transition API.

## Setup

Requires Go 1.25+, Node 22+.

```sh
cp .env.example .env        # ports: BACKEND_PORT=5700, FRONTEND_PORT=5701
cd frontend && npm ci && cd ..
make dev-backend            # terminal 1
make dev-frontend           # terminal 2, proxies /api to the backend
```

Open http://localhost:5701.

### Production build

```sh
make build                  # embeds frontend into backend/bin/calculator
./backend/bin/calculator
```

Or with Docker:

```sh
docker build -t calculator .
docker run -p 5700:5700 calculator
```

## API

`POST /api/v1/calculate` — evaluates an expression, `GET /health` — liveness.

Supported: `+ - * / ^` with standard precedence, parentheses, unary minus, postfix `%` (divides by 100), prefix `√` or `sqrt` (parens optional: `√9`, `√(2+2)`), decimal and exponent literals (`1e-7`).

```sh
curl -s localhost:5700/api/v1/calculate -d '{"expression": "(2+3)*4"}'
# {"result":20}

curl -s localhost:5700/api/v1/calculate -d '{"expression": "√9+50%"}'
# {"result":3.5}

curl -s localhost:5700/api/v1/calculate -d '{"expression": "1/0"}'
# {"error":{"code":"division_by_zero","message":"division by zero"}}  (HTTP 422)

curl -s localhost:5700/api/v1/calculate -d '{"expression": "2++3"}'
# {"error":{"code":"invalid_expression","message":"unexpected operator \"+\""}}  (HTTP 422)

curl -s localhost:5700/api/v1/calculate -d '{"expression": 5}'
# {"error":{"code":"invalid_request","message":"\"expression\" must be a string"}}  (HTTP 400)
```

Error codes: `invalid_request` (400, malformed body), `invalid_expression`, `division_by_zero`, `overflow`, `undefined_result` (422, valid request that cannot be computed), `method_not_allowed` (405).

## Tests

```sh
make test        # Go + Vitest unit tests
make e2e         # Playwright flows against the real backend + Vite
make coverage    # coverage for both layers
```

## Design notes

- **Expression string over `{op, operands}`.** The API takes `{"expression": "..."}` and the backend tokenizes, converts to RPN (shunting-yard), and evaluates. This keeps all arithmetic semantics — precedence, associativity, div-by-zero, overflow — in one tested place, and the frontend stays a thin input surface.
- **Errors are structured and terminal.** Every failure maps to a `{error: {code, message}}` body with a specific status; JSON cannot carry `Inf`/`NaN`, so overflow and indeterminate results are 422 errors rather than sentinel values.
- **The input is a MathLive `<math-field>`** — visual math editing with LaTeX underneath. Plain typing stays first-class (`2+3*4` feels like a text input; typing `sqrt` becomes a real radical with the caret inside; `/` builds a fraction), and MathLive owns cursor navigation and formula structure. The virtual keyboard is off; the app's own keypad inserts into the field.
- **A whitelisted translation engine** (`src/engine/translate.ts`) turns field content into the backend grammar: LaTeX → MathJSON (`@cortex-js/compute-engine`, `canonical: false` so structure is preserved, not computed) → a tree walk that emits exactly what `expr.go` accepts — numbers, `+ - * /`, parens, unary minus, `√`, percentage, `^`. Anything outside the whitelist (variables, `sin`, `∞`, index-3 roots) surfaces as "unsupported: X" in the UI and never produces a malformed request. The server stays notation-agnostic.
- **History is local and content-addressed.** Every successful `=` stores `{hash, latex, result}` in localStorage via zustand's persist middleware — deduped by an 8-char FNV-1a hash of the LaTeX (recomputing moves the entry to the top), capped at 50. The history sheet renders entries as real math (`convertLatexToMarkup`); selecting one re-inputs its LaTeX into the field.
- **State lives in a zustand store, not components.** `src/store/calculator.ts` owns the outcome, keypad visibility, and all actions (submit, key presses); `src/hooks/useMathField.ts` wires the math-field element to the store. Components (`src/components`) are presentational and subscribe only to the slice they render — pressing `=` re-renders the result, not the keypad. The store is unit-tested with a stubbed field and fetch.
- **Frontend logic lives in pure modules** (`src/engine`, `src/lib`, `src/store`): translation, formatting, API shaping, state — unit-tested in Vitest under node. Components and DOM wiring are excluded from unit coverage because their behavior is proven end-to-end by Playwright against the real stack.
- **Display formatting rounds to 12 significant digits** client-side; the API returns the honest float64 (`0.1+0.2` → `0.30000000000000004`).
- **Single-binary deploy.** `go build -tags embed` serves the built frontend from the Go binary; dev builds skip the embed and Vite proxies `/api`.
