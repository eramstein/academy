# Molly Moreno — Event Concepts Catalog

**Status:** brainstorming, October 2026. Not canon until individual events are authored. This is a planning companion to `molly.md` and `writing-bible.md`, not a replacement for either. The three periods are loose eligibility bands, not mandatory linear acts. Antonio is the player character (not Antoine).

## Principles

- Molly's warmth makes early friendship accessible; discovery, shared adventures, surprising courage, generosity with limits, and eventual responsibility sustain her story.
- Aim for meaningful non-relationship benefits in **roughly half** the events: cards, crafting materials, money, skill practice, unique opportunities, locations, or repeatable activities. Not every intimate or comedic scene requires loot.
- Make rewards follow the fiction. Distinguish immediate reward from a **lasting unlock** (e.g., regular running practice) and avoid stacking both gratuitously.
- Choices should be real trade-offs, not a disguised kindness test. The charitable option can yield trust, contacts, a later gift, or new access; the pragmatic option can yield resources or practical advantages. Both may be reasonable.
- Respect consent and route independence: friendship and casual playfulness require no romantic commitment. Intimacy only follows player opt-in. Molly keeps acting even when Antonio declines.
- Cross-character events should have callbacks and consistent existing story tags, without making Molly a supporting prop in Emma's narrative.

## Introduction / early availability

### M01 — First Lesson [EXISTS]

**Hook:** Molly sits beside Antonio during his first lesson and chats warmly, revealing her academic insecurity. **Role:** first impression; establishes her candid voice. **Plan:** keep existing event; avoid writing a second first meeting.

### M02 — The Little Scholars [EXISTS]

**Hook:** Molly recruits someone to tutor disadvantaged children. Antonio can accept or recommend Emma. **Role:** kindness translated into an organized project. **Gameplay/continuity:** paid tutoring opportunity or Emma referral. Preserve the existing `molly_tutoring` and `molly_emma_suggested` / `emma_tutoring_referral` dependencies used by Emma's tuition story; verify precise tags in the authored files before implementation.

### M03 — The Running Lesson [HIGH PRIORITY]

**Hook:** Between lectures, a compulsory run finds Molly chatting happily beside Emma, who is trying hard to breathe. Molly innocently keeps speeding up. **Choices:** Antonio can tease Emma (friendly rivalry if established), quietly cue Molly to slow down (empathy), or challenge Molly to a sprint (physical check). **Payoff:** Emma may thank Antonio in her own restrained fashion; Molly can offer scheduled training runs. **Gameplay:** unlock repeatable vitality training with Molly, perhaps a small one-time vitality benefit for the sprint. **Guardrail:** Emma is competent at ballet, not hopeless at all exercise; sustained running is simply not her favorite event.

### M04 — The Gentle Art of Wrestling [HIGH PRIORITY]

**Hook:** A surprisingly firm handshake prompts a playful boast; Molly challenges Antonio to a supervised friendly bout. She is small but genuinely trained. **Choices:** accept a strength/technique check, politely decline, or propose learning a hold instead. **Payoff:** win or lose, her competitive enthusiasm and concern for Antonio are funny; an accidental close-contact moment may create mild flirtation without forcing romance. **Gameplay:** victory earns a modest card or crafting component as an agreed wager; defeat leads to a restorative dinner invitation (optional date only if reciprocated); practice route unlocks physical training. **Guardrail:** avoid presenting a card gift and an unrelated dinner as arbitrary prizes; establish the wager/forfeit in dialogue.

### M05 — A Proper Pajama Evening [HIGH PRIORITY]

**Hook:** Molly invites Antonio, quite publicly, to spend the night with her; everyone misreads the invitation. She means a cozy pajama party with hot chocolate, pillows, and ridiculous games, potentially with other friends. **Choices:** join the silliness, bring a game/cards, or politely decline. **Role:** feel-good, literal-minded Molly and social embarrassment. **Gameplay:** primarily relationship and memory; an optional low-stakes card mini-game is enough. **Guardrail:** clarify the situation early; do not make her misleading or trap Antonio into sexual expectations.

### M06 — The Lake Above Town [HIGH PRIORITY]

**Hook:** Molly invites Antonio on a hike to a secluded swimming spot. Her ease with her body and playful invitation contrast with his possible reserve. **Choices:** swim, rest on shore, or reciprocate flirtation if enabled; all can lead to an enjoyable day. **Gameplay:** hiking/swimming vitality or dexterity practice, perhaps unlock periodic excursions. **Role:** nature, body confidence, carefree affection. **Guardrail:** adult, tasteful, non-explicit intimacy only if clearly chosen; protect meaningful nonromantic outcomes.

### M07 — Noble Conduct [HIGH PRIORITY]

**Hook:** Elsa sees Molly helping the Academy cleaners and rebukes her for degrading the nobility. Molly is publicly hurt and cries, then doubles down on helping the staff. **Choices:** challenge Elsa directly, support Molly privately, or help turn the dispute into a concrete improvement for the workers. **Gameplay:** access to a small paid odd job, useful workshop scraps, or a staff contact; not necessarily an instant loot reward. **Role:** softness and moral backbone coexist. **Guardrail:** give Elsa a recognizable class-bound worldview, not cartoon villainy; avoid having Antonio speak on Molly's behalf by default.

### M08 — A Letter with a Seal [NEW]

**Hook:** Molly accidentally drops an elaborately sealed letter while carrying snacks or supplies. Her family expects reports of academic progress and future duties. **Choices:** respect her privacy, offer help with a reply, or lightly tease her about the ceremonial language. **Role:** foreshadow ducal responsibilities without a biography dump. **Gameplay:** no major reward; possible family-related story tag.

## Development / overlapping themes

### M09 — Kitchen Volunteers [HIGH PRIORITY, CROSS-CHARACTER]

**Hook:** If Emma's home-cooking event has established Antonio's culinary skill, she recommends him to Molly, who is enthusiastically but disastrously helping the cafeteria staff. **Choices:** teach Molly a practical recipe, organize the kitchen efficiently, or improvise with magical ingredients. **Gameplay:** choose among common crafting ingredients, a cooking-related consumable, or a small skill increase depending on outcome. **Role:** good intentions versus practical competence; Emma gets a brief witty cameo. **Fallback:** without Emma's referral, Molly may discover Antonio's cooking through a separate legitimate trigger; do not pretend the Emma event happened.

### M10 — The Royal Pigeon Rabbit (Part I) [HIGH PRIORITY]

**Hook:** Margaret, the proprietor of the luxurious Royal Pigeon Inn, discovers Molly has hidden a rabbit in her room despite the no-pets rule. A funny, awkward negotiation follows. **Choices:** mediate with Margaret, offer to find safe accommodation, or suggest a temporary caretaker. **Gameplay:** opens a pet-rescue objective; possible inn favor or supplies. **Role:** generosity collides with responsibilities and rules. **Guardrail:** Margaret's objection is reasonable; Molly must care about the animal's welfare, not merely keeping a forbidden pet.

### M11 — The Professor's Hidden Garden (Rabbit Part II) [HIGH PRIORITY, SYSTEM PILOT]

**Hook:** An eccentric strategy professor has hidden access to an enclosed Academy garden behind a treasure-hunt clue and a special TCG guardian puzzle. It could offer a safe home for the rabbit, with the professor's permission. **Choices:** solve the deck-building or tactical puzzle, seek a less glamorous legal home, or enlist a friend. **Gameplay:** a distinctive puzzle duel and rewards for victory (card/material), plus a garden access unlock; alternate solution must exist if puzzle is declined or lost. **Role:** connects Molly to TCG play without requiring her to become a master strategist. **Design question:** establish whether the professor officially administers the garden, who tends the animal daily, and what happens when the school term ends. Test this mechanic as a reusable RPG activity before proliferating treasure hunts.

### M12 — The Forest Mother's Bargain [HIGH PRIORITY]

**Hook:** On a forest expedition, Antonio and Molly gather rare ingredients, then discover that a dangerous animal is defending hungry young. **Choices:** surrender some findings to obtain safe food or aid (with a plausible method), carefully retreat with materials, or use an appropriate card/skill to solve both needs at some cost. **Gameplay:** retain rare resources versus Molly's later grateful gift, a nature contact, or a special green-themed card; avoid rewarding kindness with an objectively superior package. **Role:** compassion under pressure; Molly can be fiercely protective without treating the mother animal as a villain. **Guardrail:** helping must actually improve the animals' situation, not simply feed unsuitable magical ingredients to them.

### M13 — The Worst Student in the Best Study Group [NEW]

**Hook:** Molly asks Emma and Antonio to help her prepare for an artificery examination. Emma's brilliant explanations sail over her head; Molly notices everyone's mounting frustration. **Choices:** teach patiently with analogies, drill game fundamentals, or help Molly identify the one craft she truly enjoys. **Gameplay:** Antonio gains a small teaching/knowledge benefit or practice materials; Molly improves independently as well. **Role:** academic insecurity without making her stupid.

### M14 — A Very Good Bad Idea [NEW]

**Hook:** Molly promises help to too many children, students, and inn staff on the same afternoon. Every promise was sincere; together they are impossible. **Choices:** help prioritize, take over a task at personal time cost, or encourage her to refuse one obligation respectfully. **Gameplay:** money/job access or modest resources from the task completed; friendship and a boundary-learning tag. **Role:** kindness needs judgment.

### M15 — A Little Tournament of Strength [NEW]

**Hook:** An Academy fair hosts wrestling, balance, and relay contests. Molly is joyfully competitive and far more feared than the larger students. **Choices:** partner with her, challenge her, or coach another team. **Gameplay:** vitality/dexterity check, fair prize card or resources, and optional regular sport schedule. **Role:** her cheerful self-interest and competitive streak. **Guardrail:** don't repeat M04's surprise reveal; here everyone knows she is formidable.

### M16 — A Difficult Beneficiary [NEW]

**Hook:** A recipient of Molly's charitable support repeatedly breaks promises, but their family remains in need. Emma sees manipulation; Molly sees suffering. **Choices:** give more directly, set conditions and practical supports, or decline further help while finding alternatives for dependents. **Gameplay:** resource expenditure or gain, tutoring-program stability, future contacts. **Role:** a morally serious choice without a universally correct answer. **Guardrail:** make circumstances nuanced and outcomes persistent.

### M17 — The Moonlight Picnic [NEW, OPTIONAL ROMANCE]

**Hook:** Molly prepares an elaborate romantic evening, but her enthusiasm makes the supposedly spontaneous invitation transparent. An innocent mishap threatens her carefully packed food. **Choices:** play along, tell her plainly how Antonio feels, or keep the evening friendly. **Gameplay:** mostly intimacy/memory; possibly a future recurring date activity. **Role:** joyful sensuality, sincerity, and comic ingenuity. **Gate:** mutually established romantic interest; offer a separate friendship outing rather than repurposing this scene for every player.

### M18 — The Child Who Wouldn't Come [NEW]

**Hook:** A talented child repeatedly misses tutoring; Molly assumes she has failed to make lessons welcoming. Antonio discovers family work obligations or another structural obstacle. **Choices:** offer money, negotiate a flexible lesson schedule, or organize a community solution. **Gameplay:** teaching/crafting benefits, access to a local contact, or rare ingredient from a grateful family depending on credible circumstances. **Role:** class blind spots and emerging leadership.

## Late / the reluctant Duchess

### M19 — A Summons from Home [LATE ENTRY]

**Hook:** Family news requires Molly to prepare for responsibilities she hoped to postpone. **Choices:** listen and help her make sense of the options, propose practical preparations, or encourage an honest conversation with her family. **Gameplay:** unlock travel/estate-related opportunities; no obligatory relationship reward for merely advising. **Role:** serious conflict without Antonio commandeering her decision.

### M20 — The Duchess's Daughter [LATE]

**Hook:** A visit to the family estate exposes the distance between Molly's informal Academy identity and the expectations of household, tenants, and relatives. **Choices:** assist with a local problem, learn about the estate, or navigate a formal occasion. **Gameplay:** regional crafting materials, new NPC contacts, or a special card commissioned by the estate, with earned prerequisites. **Role:** privilege, affection, discomfort, and responsibility.

### M21 — The Price of Mercy [LATE]

**Hook:** Molly must allocate limited estate resources among competing needs; every claimant has a compelling case. **Choices:** help investigate, support a costly immediate remedy, or build a slower sustainable plan. **Gameplay:** resource costs, reputation and contacts, future access to production or materials. **Role:** generosity becomes governance. **Guardrail:** avoid a simplistic 'correct budget' and let Molly decide after receiving advice.

### M22 — On Her Own Terms [LATE MILESTONE]

**Hook:** Following enough independent developments, Molly chooses how to relate to her title, family, charitable ambitions, and personal freedom. **Choices:** Antonio can express support, concern, or a personal hope, but the final choice belongs to Molly and reflects established state. **Gameplay:** different long-term opportunities—estate patronage, charity network, travel access—without making one romance-locked ending objectively superior. **Role:** an earned culmination, not an obligatory single finale.

## First drafting batch and dependency notes

**Recommended order:** M03 _Running Lesson_ (links Emma and unlocks scheduled training); M04 _Wrestling_ (signature surprise and skill check); M07 _Noble Conduct_ (heroic goodness with Elsa); M05 _Pajama Evening_ (pure social comedy). Follow with M06 _Lake_, then M10–M11 _Rabbit/Garden_ as the first substantial two-part activity. M09 _Kitchen Volunteers_ should wait until the Emma home-cooking predecessor and its exact flags are confirmed. M12 _Forest Mother's Bargain_ can introduce the first difficult values-versus-materials choice.

**Continuity checks before implementation:**

1. Verify the actual first-lesson and Little Scholars event IDs, tags, and outcomes. M02 must remain compatible with Emma's tuition problem (`molly_tutoring`, referral conditions).
2. Confirm which skill names exist before assigning vitality, dexterity, or cooking improvements as exact effects; concepts here intentionally do not invent JSON schemas or quantities.
3. Confirm scheduled sporting activities, player physical skill checks, NPC locations, and Emma's home-cooking tag.
4. Decide whether puzzle-guardian matches are a general Academy feature; prototype one fair, explainable tactical encounter with an accessible fallback.
5. Make missed events and ongoing projects progress offscreen where appropriate; preserve friend-only versions of outdoor and social encounters.
