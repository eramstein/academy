# Event: A Standing Engagement

**NPC:** emma  
**Event ID:** `emma_music_job_offer`  
**Trigger:** `emma_violin_evening` has occurred; Emma is present; friendship >= 3; respect >= 2
**Manual trigger:** Emma has a proposition  
**Emotion:** happy

## Text

"Antonio! Just the man I was looking for."

Emma approaches you with a particularly satisfied expression. Evidently, something has gone her way.

"Remember our little musical enterprise? Well, I've received an offer from the Old Monk Inn. They want me to perform every Friday evening. Regular pay, generous tips, and apparently an audience with excellent taste."

She pauses, smiling.

"Naturally, I accepted. But I'd much rather concentrate on the violin than spend half the evening chasing drunken merchants for their unpaid bills."

She regards you thoughtfully.

"So, what do you say to making our partnership official? Every Friday evening, a few hours of honest work, and we divide the earnings. I provide the artistic talent, you provide the indispensable logistical support."

Her smile turns mischievous.

"An exceptionally fair arrangement, wouldn't you agree?"

## Options

### Option A: Accept the partnership

**Text:**

"Why not? We made a pretty good team last time."

"Excellent! I knew you were a man of sound judgment."

Emma looks delighted.

"Friday evenings, then. The Old Monk Inn. I'll speak to the innkeeper and make the arrangements."

She begins to leave, then turns back.

"Oh, and Antonio? If anyone asks, you're my _manager_. It sounds so much more distinguished than 'the fellow who carries the drinks.'"

**Outcomes:**

- Unlock and schedule recurring job: **Musical Evenings with Emma**
  - placeKey: old-monk-inn
  - Schedule: Every Friday evening
  - employerKey: emma
  - jobType: Music
  - payPerActivity: 100
- Emma friendship +1.
- Add story tag `emma_music_partnership`.

### Option B: Decline politely

**Text:**

"I'm afraid I can't commit to every Friday evening. Academy life keeps me busy enough already."

"Of course. A demanding scholarly career must come first."

Emma nods, entirely untroubled.

"I'll find someone else to help. Perhaps a young man with fewer ambitions and a greater appreciation for carrying trays."

She gives you a teasing smile.

"Still, you must come and listen sometime. I promise not to charge you admission."

**Outcomes:**

- No additional game-state effects.
