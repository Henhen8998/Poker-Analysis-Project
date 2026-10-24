# AI Poker Strategy Lab ? new Phase 1 application

The new React + TypeScript + Tailwind interface and FastAPI calculation API live in `frontend/` and `backend/`. The earlier static prototype below is preserved; its capability descriptions do not describe the new MVP.

## Run the new application

From this directory, double-click `Launch Poker Lab.cmd`, then visit http://127.0.0.1:8000.

First-time setup:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
cd frontend
npm.cmd ci
npm.cmd run build
cd ..
backend/.venv/Scripts/python.exe launch_lab.py
```

For development, run `backend/.venv/Scripts/python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000` from the project directory and `npm.cmd run dev` from `frontend/`. Vite proxies `/api` to Python.

Tests: `backend/.venv/Scripts/python.exe -m pytest python_tests -q`; frontend: `cd frontend` and `npm.cmd test`.

The MVP supports an editable nine-seat cash snapshot, stakes, USD/BB display, cards, street, pot/call entry and Python-calculated pot odds. It does not yet simulate betting rounds or recommend a play. Money inputs validate when you leave the field. Short-stack calls require a user-specified eligible pot. See [PROJECT_NOTES.md](PROJECT_NOTES.md) for verification, assumptions and remaining phases.

The existing static hosting manifest serves the previous prototype. The new app requires a Python host; it has not been deployed to that static Site.

---

# Poker Decision Lab — Phase 1

## Automatic equity and positions (latest update)

Action review now uses your selected hero seat and two hole cards. Select a street, fill the board through that street, and specify opponents still in the hand (1–8, no more than other occupied seats). Record an action to run 2,000 reproducible Monte Carlo trials in a web worker. Unknown hands are uniformly random, not inferred from actions or positions. Results include fractional split-pot equity, win/tie/loss rates, and an approximate 95% sampling margin; this interval does not capture incorrect range assumptions. Earlier-street calculations ignore later cards. No folded dead cards are modeled.

The call EV benchmark is calculated automatically from simulated equity and entered pot/call amounts. It also updates the calculator below; its disabled slider displays the latest simulation, while preset buttons remain illustrative examples. Calls/folds are graded only for the explicitly selected terminal heads-up model. Bet/raise EV, ICM, stacks, and automatic betting state remain unsupported. Reviews are for hero actions only because opponent hole cards are unknown.

The dealer selector assigns BTN, SB, BB, and early/late positions clockwise through occupied seats, with BTN/SB combined heads-up. Position does not change the uniformly random range assumption. Run `node equity-test.mjs` for ranking, split-pot, position, reproducibility, and 500 exhaustive five-card subset comparison checks. Earlier prototype descriptions below reflect prior versions; this section supersedes their manual-equity behavior.

## Local coaching prototype

Record actions by occupied seat and street. Each entry snapshots cards visible at that street, pot, amount to call, action amount, and manually supplied acting-player equity. Later board cards are excluded from earlier-street snapshots. This is a manual review log, not a betting state machine: stacks, turn order, minimum raises, and automatic pot transfers are not implemented. Reset table/cards and clear history are separate controls. History lasts for the current page session.

The rule-based coach compares calls/folds with a simplified heads-up terminal chip EV benchmark only when explicitly selected. Other actions or future betting return “Needs more context.” Percentages mean estimated equity and break-even equity, never a calibrated probability that a play is good. No LLM, range inference, hand-derived odds, ICM, or strategic accuracy score is claimed. Run `node coach-test.mjs` for coaching checks.

Table setup: toggle occupancy for nine seats, select your occupied hero seat, and enter two hole cards plus the flop, turn, and river using rank/suit selectors. Selected cards are unavailable in other selectors. Partial or out-of-order boards show guidance. Reset restores nine occupied seats and clears the cards. Table and card inputs do not yet drive equity estimation; the EV calculator continues to use manually entered equity and its heads-up assumptions.

A dependency-free website for heads-up all-in pot odds and chip EV study. Serve `dist` with `python -m http.server 8765 --directory dist` and open http://localhost:8765.

Run mathematical checks with `node test.mjs`.

Pot before call includes the opponent's bet. Final pot = pot + call; break-even equity = call / final pot; call EV = equity × final pot − call; fold EV = 0 from the current decision point. Equity is an external input and includes the expected share of ties. Units are chips, not tournament prize money.

Assumptions: heads-up, no future betting, rake, side pots, or unequal pot eligibility. Does not compute ranges, hand equity, ICM, or GTO strategy. Explanations are formula-based; no LLM integration is claimed. Python/Streamlit, simulation, ICM, and SQLite remain future increments from the project plan.
