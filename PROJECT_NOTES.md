# AI Poker Strategy Lab

## Phase 1 — October 23, 2026

User approved the proposed scope and delegated subsequent design questions and phase decisions. Learning questions are optional and do not gate work.

Implemented a new React/TypeScript/Tailwind frontend in `frontend/` and FastAPI snapshot API in `backend/api.py`. The previous prototype remains in `dist/` and is not overwritten. The new frontend calls Python for calculations; it does not use the old JavaScript EV engine.

Features: nine editable seats, 2–9 occupancy, arbitrary Hero/dealer, clockwise positions including heads-up BTN/SB, player names and remaining stacks, seven stake presets and custom blinds, USD/BB display, street/card selection, duplicate card exclusion, manually entered pot and amount facing Hero, pot odds, and short-stack eligible-pot validation. Currency is stored as integer cents; Decimal validates conversions. Invalid fractional-cent inputs are rejected. Unit switches preserve stored amounts. Currency inputs commit on blur; calculation and unit switching are disabled while an edited value awaits validation.

Pot before call includes Villain's outstanding bet. Required equity = actual call / (eligible pot before call + actual call). A short call requires a separately entered eligible pot, excluding excess bets and side pots. This is user-provided snapshot information; the app cannot verify eligibility without contributions. No rake or future betting is modeled.

## Verification

- 24 Pytest cases passed: known-answer pot odds, monetary conversion, invalid inputs, duplicate cards, street mismatch, short-stack calls, occupancy, check situations, and initial ICM conservation.
- 3 React component tests passed: nine seats, USD/BB preservation, duplicate cards/street selection, Hero seat changes, and exact-cent analysis payloads. The API is mocked in component tests; these are not browser end-to-end tests.
- TypeScript and Vite production build passed.
- Browser verification unavailable: the computer-use tool reported no connected browsers. Responsive layout is implemented in CSS but has not been visually checked.

## Deliberate limits

Phase 1 shows immediate snapshot choices; it does not execute actions or enforce complete betting order. No equity, EV-based recommendation, rake, ante, persistence, tournament UI, or LLM coach is integrated. No solver claims are made.

The early `poker_lab/betting.py` and ICM function were written before the complete prompt arrived. Betting is experimental, unvalidated, and disconnected. ICM has only initial tests and is not a completed Phase 4 feature.

Hosting: the existing Site serves static files. This new app needs a Python host, so it runs locally rather than publishing a frontend whose API would be unavailable. Deployment requires a Python backend host and compatible frontend routing.

## Next increments

Phase 2: tested hand evaluator, explicit ranges, seeded equity, shared quick analyzer, and conditional call EV. Then Phase 3 betting engine and SQLite scenario persistence, Phase 4 tournament/ICM comparisons, Phase 5 action trees, Phase 6 grounded LLM explanations, and Phase 7 portfolio QA.

## Learning checkpoint

Explain why `parse_money` uses Decimal while stored amounts use integers. Explain why `analyze` caps a call at Hero's stack, and why that alone does not identify the eligible pot. Optional numerical exercise: a $150 pot and $50 call require 25% equity; what assumptions would you need before turning that threshold into a call recommendation?

## Bet entry clarification

Replaced amount-facing input with Hero current-street contribution and total bet to match. Call = max(0, total to match - Hero contribution). Added Record Hero bet for an opening bet when no chips are yet committed by Hero and no call is outstanding. It adds the entered incremental amount to the pot, subtracts it from remaining stack, and records Hero street contribution. It does not simulate opponents or validate raises. Changing street clears current-street contributions and outstanding bet, keeping the pot and remaining stacks. Added a component test covering $20 versus $60 and chip transfer on a $25 bet.

Desktop launcher: AI Poker Strategy Lab.lnk on the OneDrive desktop runs desktop_launcher.py through pythonw.exe. Reuses an existing lab server or starts it hidden, waits for readiness, then opens the default browser. Startup errors show a dialog and write launcher.log. Mocked launcher checks passed for server reuse and hidden startup.
