Event: A Friendly Wager
NPC: farid
Event ID: farid_friendly_wager
Trigger: Day 2, afternoon
Manual trigger: Farid has a challenge
Emotion: proud
Text
"Antonio! Just the man I was looking for."

Farid approaches with a grin that suggests he has already decided how this conversation will end.

"I've been assessing the talent around here. Frankly, I'm beginning to understand why my old Academy had such a good reputation."

How tactful of him.

"Anyway, fancy a match? Let's make it interesting. If you win, I'll give you a hundred gold. If I win, you owe me a favor. Nothing scandalous, I promise."

He pauses.

"Well, nothing terribly scandalous."
Options
Option A: Accept the wager
Match: Farid El-Khouri
Next: wager_result

Text:

"Excellent!" Farid produces his deck with suspicious speed. "I knew you had some courage. Let's see if you have any talent to accompany it."
Option B: Decline
Text:

"Afraid of losing?"

Farid shrugs theatrically.

"Never mind. I suppose I'll have to find someone else willing to improve my afternoon."
Node: wager_result
Title: Settling the wager
Emotion: neutral

Passages:

result

When: antonio_won

Farid stares at his defeated cards, then bursts out laughing.

"Well! Perhaps this Academy isn't entirely hopeless after all."

He tosses you a purse of coins.

"A hundred gold, as promised. Don't spend it all celebrating. I intend to win it back."

Otherwise:

Farid leans back, looking thoroughly pleased with himself.

"Splendid! One favor owed to Farid El-Khouri. I'll think of something suitably entertaining."

That is precisely what worries you.

### Option A: Take the purse

**Only if:** last match was won

**Outcomes:**

- Add 100 gold to Antonio's inventory.
- Add story tag farid_wager_won.

### Option B: Accept the debt

**Only if:** last match was lost

**Outcomes:**

- Add story tag farid_favor_owed.
