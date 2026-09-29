# Battle AI — Implementation Plan

Migrate from the heuristic persona in [architecture.md](architecture.md) to the search loop in [proposed-architecture.md](proposed-architecture.md).

Each phase leaves the game playable. The live policy stays the Normal persona until phase 3 flips it. There is no test runner in this repo; each phase is checked with `npm run check` and by playing a battle, plus the shadow logs called out below.

Do not turn on greedy continuation in these phases. `continuationEnabled` stays false. Latent attacks and the epilogue are part of the first playable search, not a later add-on. A score taken on the raw post-action board will treat stuns, poison, and mana rituals as blanks.

## Phase 0 — Types, caps, and a synchronous apply

Add the scaffolding with no change to what the AI plays.

- Add the candidate union and weight-preset type to [`model.ts`](../model.ts). Candidates store `instanceId`s and position keys.
- Add the cap defaults to [`config.ts`](../../../_config/config.ts): `maxSimulations` 24, `maxAbsoluteSimulations` 32, `maxTargetAssignments` 4, `randomSamples` 1, `continuationEnabled` false.
- Add `apply.ts`. It resolves ids on the current `bs`, then calls the engine. Headless spell resolution runs the effect and the discard immediately, with no `setTimeout` and no write to `uiState.battle.playedSpell`. Combat targets are the objects on that `bs`, because `attackUnit` compares them by identity.
- Gate `playAiTurn` in [`turn.ts`](../../turn.ts) on `!uiState.isHeadless`.
- Change [`ai.worker.ts`](../ai.worker.ts) so one worker evaluates a list. For each candidate, reset battle state from a deep clone (do not `Object.assign` over the previous trial), reset pending UI fields, apply, and return a compact result. One thrown candidate becomes a loss for that id. The batch continues.
- Reset `actionsPlayedthisTurn` inside `playAiTurn`.

Exit when a debug call can apply a deploy, a spell, and an attack in the worker, the spell's effect is visible in the result with no leftover timer, and the live AI still plays exactly as before.

## Phase 1 — Unit value and position score, log only

Implement `valueUnit` and `valuePosition` in `evaluate.ts` as specified in the proposed architecture.

- Board bodies exclude OnDeploy ability cost. Missing health scales only the health feature cost, by `sqrt(currentHealth / maxHealth)`. Current power is repriced at 4 per point. Hand cards still use the full budget, including OnDeploy, at 0.35.
- Life uses separate `aiLifeWeight` and `opponentLifeWeight`. Terminals are sort keys, not infinities inside the sum.
- Include the mana credit and the color-progress credit. Log a mana ritual above pass when the mana pays toward a card in hand, and a useless color bump at about the same score as pass.
- Treat an empty board as ratio 0.5 in the preset picker.
- Put the exchange-rate table in [`valuations/config.ts`](../valuations/config.ts). The live preset is Normal.
- Log `valuePosition` on the live state once per AI decision. Do not read `simulatedNextTurn`. Do not use the log to pick an action.

Exit when a win sorts above a finite score, a loss sorts below it, a 1-health attacker keeps its full threat budget, an empty burn logs lower than the position before it, and a color bump that unlocks a card logs higher than a bump that unlocks nothing.

## Phase 2 — Epilogue, latent attacks, candidates, still in shadow

Implement `epilogue.ts`, `latent.ts`, `candidates.ts`, and `heuristic.ts`. Still play with the Normal persona.

- The epilogue fast-forwards turn end, the opponent's turn start, and `autoAttack` for each ready opponent unit. Score after that, then add latent and mana credit measured before the fast-forward.
- Latent credit uses `valueUnit` and life deltas in budget points, `latentFactor` 0.85, and kills each body once.
- Generate candidates with one cell per unit, all four colors, and at most four target assignments per spell or ability. Quotas are one candidate each. Tie-break equal ranks by mana cost, highest first.
- Force obvious lethal attacks. When the pass epilogue is a loss, force a block into that row and fill the spell quota with answers first.
- Log, side by side, the action Normal actually played and the top of the capped queue, plus the pass epilogue's terminal result.

Leave live trigger targeting on the current random picker during this phase. Swapping it for the queue heuristic would change real games before the score exists, and the shadow log would no longer be the old bot.

Exit when a logged turn stays within 24 slots (32 if a lethal or a survival insert was forced), the queue is not all moves, a power-versus-life lethal appears in the forced set, and an unknown spell still receives a slot. A stun or a removal aimed at a lethal row has to appear in that set when pass dies. Confirm a poisoned or stunned attacker deals its real damage in the epilogue, including no damage when `canAttack` is false.

## Phase 3 — Search becomes the live policy

Add `search.ts` and the trigger ply. Switch the loop in [`ai.ts`](../ai.ts).

- The worker applies each candidate, resolves triggers by trying up to four targets and keeping the best epilogue for the trigger's owner, then returns the score breakdown.
- Order results by terminal first (wins, then finite scores, then losses). Several wins break by the finite score.
- Play the winner on the live `bs` through `apply.ts`, then wait `aiActionInterval` and search again.
- Pass when it is the best score, or when the capped list is only pass.
- Live AI triggers use the same one-ply picker. Human triggers on the live board stay with the human.
- Gate with `config.aiPolicy`: `'heuristic' | 'search'`. Default flips to `'search'` only after the phase 2 logs look sane on a few matches. Leave `'heuristic'` in place.

The player ability is no longer taken before the persona. Color and land actions are candidates. Delete the call path that always runs `incrementRandomColor` when nothing else applied.

Exit when a match under `'search'` does all of the following:

- Casts a spell the old persona does not understand, and the board moves the way the score predicts.
- Passes rather than casting a spell that changes nothing useful.
- Casts a mana ritual when the mana pays a card still in hand, and passes when it does not.
- Plays a removal or a stun when pass would die, then survives the epilogue.
- Attacks with a ready unit after a removal opens it, and attacks immediately when the face attack itself is the candidate.
- Keeps a 1-health attacker in the fight instead of treating it as a quarter of a card.

## Phase 4 — Presets, then delete the old policy

- `getAiStrategy` returns a weight preset from board share, and `valuePosition` uses it. Aggro is the Aggro preset for the whole match.
- Stop calling `getAiGoals`, the Normal priority list, and the Aggro random list from the live loop.
- Stop reading `aiHints` anywhere in `src/lib/battle/ai`. Leave the field on card templates so old data still loads.
- Remove `simulatedNextTurn` and `EVALUATE_PASS_TURN` once nothing reads them. Point `rows.ts` at the state it is passed.
- Keep the policy flag until a few real games look right. Then delete the old persona.

Exit when `'search'` is the only policy, `npm run check` is clean, and a match against a deck that includes a generated or hint-less card does not throw and does not spend the turn casting at random.

## Later, only if phase 3 still misses kills

Implement greedy continuation behind `continuationEnabled`, with `continuationSteps` 6 and `continuationBranch` 4, and with the latent credit off on those scores. Continuation only walks lines the heuristic already ranks highly. Start it when a real game shows a two-step line (move then attack, or two spells) that latent attacks and the epilogue cannot see.

## Risks

- **Global `bs`.** Every trial runs in the worker on its own clone. Search must not call `apply` on the live module until a winner is chosen.
- **Spell timers.** Headless `playSpell` has to resolve in place. A `setTimeout` scores a blank and then corrupts the next candidate.
- **Identity.** Targets and sources are re-found by `instanceId` on the clone before any engine call.
- **`playAiTurn` from `nextTurn`.** The epilogue will start a second AI loop in the worker unless that call is gated on `!uiState.isHeadless`.
- **Trigger side.** Opponent triggers in the search maximize the opponent's score. Maximizing the AI's score there makes every line that trips their trigger look safe.
- **Hand value too high.** The AI will hoard. Too low, and it will dump spells that change nothing. 0.35 is a starting point; the empty-burn check is the calibration.
- **Life priced too low.** Normal will develop forever and attack only when the terminal sort fires. Raise opponent life per point before adding special cases.
- **Color bumps look like doing nothing.** The color-progress credit has to move when a card in hand becomes payable, and all four colors have to be simulated or the right one may never be scored.
- **Worker payload.** Return scores, not full battle states.
- **Cap starvation.** If phase 2 logs show one category filling the 24, tighten that quota. Do not raise `maxSimulations` as the first fix.
