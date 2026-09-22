# Flavor Generation Pipeline — Implementation Progress

| Phase | Status | Notes |
| --- | --- | --- |
| Docs (`systems.md`, this file) | done | Architecture + checklist |
| Phase 0 — Types / load `card_flavor_templates.json` | done | `GameplayTemplate`, extended `FlavorTemplate` |
| Phase 1 — Threshold match + IndexedDB used tracking | done | `match.ts`, `used-flavors.ts`, `initSim` clear |
| Phase 2 — Async artificery + callers | done | `resolveFlavorTemplate` wired |
| Phase 3 — DEV LLM text generation | done | `generate-text.ts` |
| Phase 4 — Comfy + Vite persist | done | `generate-image.ts`, `persist.ts`, vite middleware |
| Phase 5 — Mock image upgrade | done | `upgrade.ts` no-op provider |

## Follow-ups (not started)

- Tune `MATCH_SCORE_THRESHOLD`
- Real remote image upgrade provider (~6/day)
- Optional Sharp normalization inside save-image middleware
- Production remote persistence (out of scope for hobby playtest)
