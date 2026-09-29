---
name: explain-ai-play
description: Explains why the battle AI chose one move over alternatives from a battle state fixture or /dump JSON, using the search-based decision loop in src/lib/battle/ai. Use when the user asks why the AI played something, passed, skipped a move or attack, behaved oddly in battle, or shares src/lib/battle/ai/fixtures/*.json or clipboard battle state after /dump.
---

# Explain AI play

The live opponent uses **`config.aiPolicy === 'search'`** (see `src/lib/_config/config.ts`). The old persona loop in `ai.ts` (`heuristic`) is not the default; say so if the user is on that path.

## Required reading

Before reasoning, read **`src/lib/battle/ai/docs/proposed-architecture.md`** (decision loop, quotas, survival inserts, epilogue, position score). For legacy persona behavior only, see `src/lib/battle/ai/docs/architecture.md`.

## Inputs

| Source | Notes |
| --- | --- |
| `src/lib/battle/ai/fixtures/<name>.json` | Preferred; keep repro cases here |
| JSON from `/dump` | Quicksave + clipboard; same shape as `BattleState` |
| User description | Which move looked wrong vs what the AI did |

### Fixture timing (critical)

The user’s workflow:

1. They finish the human turn.
2. They `/dump` **just before clicking End Turn** (`isPlayersTurn: true`).
3. They paste that into a fixture and ask why the AI then did (or did not do) something.

So the fixture is **not** already the AI decision state. It is the state **immediately before** `nextTurn()` hands control to the AI.

**Always advance the fixture into the AI turn before explaining**, the same way the live game does:

1. Load the dump into `bs` (`replaceBattleState`).
2. Set `uiState.isHeadless = true` so `nextTurn()` does **not** auto-call `playAiTurn()` (see `turn.ts`).
3. Call **`nextTurn()`** — this flips `isPlayersTurn`, refreshes AI units (`hasMoved` / `exhausted` / `hasAttacked`), draws, restores mana, clears `abilityUsed`, etc.
4. Then run the search loop the same way **`playAiTurn()` → `loopSearch()` → `chooseAction()`** does in `src/lib/battle/ai/ai.ts`.

Do **not** treat stale AI unit flags on the dump (`exhausted: true`, `hasMoved: true` from the previous AI turn) as “the AI cannot act.” Those flags are cleared by `nextTurn()` when the AI’s turn starts.

**Browser saves:** IndexedDB holds sim only; battle is in localStorage on quicksave. You cannot read the user's browser from the agent; use a fixture file or pasted JSON.

## Goal

Explain **why the AI picked move A rather than move B** (or pass), in terms of the implemented pipeline—not generic TCG advice.

Distinguish:

1. **Policy choice** — B was simulated and scored worse (or lost terminal).
2. **Queue miss** — B never entered the capped simulation set (heuristic rank, quota, or survival insert rules).
3. **Model gap** — epilogue/score does not represent something the human cares about (document as limitation, not “the AI is random”).

## Analysis workflow

1. **Advance the dump** with `nextTurn()` under headless (see Fixture timing). Summarize the **AI decision** position (2–4 sentences): turn, life, mana, board rows, AI hand highlights, obvious threats.
2. **Replay the AI turn** by looping `chooseAction()` (or the same generate → `capQueue` → evaluate → apply path) until `pass` or game over — matching `playAiTurn` / `loopSearch` in `ai.ts`. Prefer a real simulation over guessing from board reading alone.
3. **Name the candidates** the user cares about using `candidateLabel` vocabulary in `src/lib/battle/ai/apply.ts` (`attack`, `move`, `deploy`, `spell`, `activate`, `color`, `pass`).
4. **Trace generation** — `candidates.ts`: was the expected line legal (`isPayable`, `canMove`, `canAttack`, cells, targets) **on the AI turn state**?
5. **Trace queue** — `heuristic.ts` + caps in `proposed-architecture.md`: quota slot, leftover, or survival insert?
6. **Trace simulation outcome** — apply → triggers → terminal? → epilogue → `valuePosition` / `scoreLine`. Pass always simulated; check survival inserts if pass epilogue is `loss`.
7. **Compare winner vs alternative** using score breakdown fields (`life`, `board`, `lands`, `hand`, `color`, `mana`, `latent`, `terminal`) and logs (`AI chooses`, `AI survival inserts`).
8. **Preset** — `getWeightPreset()` / `config.aiPersona` (`normal` vs locked `aggro`) if relevant.

### Running the simulation without a browser Worker

`chooseAction()` uses `ai.worker?worker`, which needs a browser `Worker`. In Node / `vite-node`, evaluate candidates **inline** the same way the worker does (`ai.worker.ts`):

- `generateCandidates()` → `capQueue(...)` → for each candidate: `replaceBattleState(baseline)` → `applyCandidate` → `scoreLine(baseline, AI_PLAYER_ID)`
- Pick best by terminal then score (same `compareScores` as `search.ts`)
- `applyCandidate` on the live board, then loop until pass

A one-off script under `src/lib/battle/ai/fixtures/` is fine for a repro; delete it after if it was only for the explanation.

## Output format

Use this structure unless the user asks otherwise:

```markdown
## Situation
[Board/threat summary after nextTurn; AI id 1; decision point]

## What the AI did
[Concrete action sequence from the simulated loop]

## What you expected
[User’s alternative]

## Pipeline
- **Generated?** yes/no — [rule or missing candidate reason]
- **Simulated?** yes/no — [quota/heuristic/cap reason]
- **Outcome vs alternative** — [terminal and/or main score terms that differ]

## Why A beat B
[Plain language tied to epilogue + weights, not card names alone]

## If we wanted different behavior
[Weight/quota/heuristic/epilogue tweak category—no drive-by refactors]
```

## Code map (search policy)

| Step | File |
| --- | --- |
| End Turn → AI | `src/lib/battle/turn.ts` → `nextTurn()` then `playAiTurn()` |
| Turn loop | `src/lib/battle/ai/ai.ts` → `playAiTurn` / `loopSearch` → `chooseAction` |
| Pick + log | `src/lib/battle/ai/search.ts` |
| Candidates | `src/lib/battle/ai/candidates.ts` |
| Queue cap | `src/lib/battle/ai/heuristic.ts` |
| Apply | `src/lib/battle/ai/apply.ts` |
| Worker eval | `src/lib/battle/ai/ai.worker.ts` (mirror inline when headless in Node) |
| Epilogue | `src/lib/battle/ai/epilogue.ts` |
| Score | `src/lib/battle/ai/evaluate.ts` / `simulate.ts` |
| Snapshot restore | `src/lib/battle/ai/snapshot.ts` |
| Settings | `src/lib/_config/config.ts` |

## Do not

- Explain from the raw dump’s AI unit flags without applying `nextTurn()` first.
- Assume `architecture.md` persona priorities when `aiPolicy` is `search`.
- Explain from card text alone without tracing queue + score.
- Treat `rows.ts` danger as exact lethal; epilogue + terminals decide deaths.
- Change AI code unless the user asks to fix the behavior after the explanation.
