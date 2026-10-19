# Event: A Matter of Taste

**NPC:** emma  
**Event ID:** `emma_home_cooking`  
**Trigger:** Evening; at cafeteria; story tag `emma_trusted_companion`  
**Emotion:** happy
Image: large

## Text

You're about to join the cafeteria queue when you hear a familiar voice behind you.

"Antonio! Surely you're not planning to eat _that_."

Emma approaches, eyeing the evening's offering with obvious suspicion.

"I was just heading home. Why don't you join me for dinner? I have some provisions, and I rather fancy cooking something myself for a change."

She smiles. "Unless you're particularly attached to boiled cabbage."

## Options

### Option A: Accept the invitation

**Next:** dinner

**Text:**

"Well, when you put it like that..."

"Excellent. Come along, then. I promise you something considerably more interesting."

**Outcomes:**

- No additional game-state effects.

### Option B: Decline politely

**Text:**

"Thanks, Emma, but I think I'll stay here tonight."

"As you wish." She glances toward the serving counter. "I admire your courage, if not your judgment."

She gives you a cheerful wave and heads off toward the village.

**Outcomes:**

- No additional game-state effects.

---

## Node: dinner

**Title:** A Matter of Taste  
**Image:** `emma_home_cooking.jpg` large  
**Emotion:** embarrassed

Emma's room is as you remember it: books everywhere, papers arranged in precarious towers, and just enough space on the little table for two plates. Tonight, however, the usual scholarly apparatus has been pushed aside to make room for a chopping board, a collection of vegetables, and a frying pan.

Emma rolls up her sleeves with the confidence of a woman about to perform a particularly elegant experiment.

"Now, let's see. This shouldn't be difficult."

Twenty minutes later, you are beginning to suspect otherwise.

The vegetables have been cut into wildly different sizes. Something at the bottom of the pan is turning an alarming shade of black, while the rest remains stubbornly raw. Emma studies the situation with increasing irritation, as though the ingredients are deliberately refusing to cooperate.

"How curious. I followed the recipe precisely."

You glance at the open cookbook. She has, in fact, skipped two steps and confused a teaspoon with a tablespoon.

"Emma, would you mind if I took over?"

She looks at you, genuinely affronted.

"Antonio, I am perfectly capable of preparing a simple meal."

A small cloud of smoke rises from the pan.

You both watch it.

"...Although I suppose a second opinion wouldn't hurt."

She reluctantly hands you the spoon.

You rescue what can be saved, clean the pan, and start again. Before long, the vegetables are sizzling pleasantly, the sauce has thickened, and the room is filled with a considerably more encouraging aroma.

Emma watches with undisguised fascination.

"Well. You seem remarkably practiced at this."

"I used to cook for my family. My parents were often ill, so somebody had to make dinner."

Her expression softens.

"I see. That must have been difficult."

You shrug. "You learn quickly when the alternative is going hungry."

Emma smiles faintly. "My parents always insisted I concentrate on my studies. They took care of practically everything else, even when they could scarcely afford the time. I suppose they rather spoiled me in that respect."

She considers the pan thoughtfully.

"Which explains why I can calculate the precise proportions of an alchemical compound, yet apparently cannot be trusted with an onion."

You offer her a taste of the sauce.

She takes it, pauses, and closes her eyes appreciatively.

"Oh, that's _good_."

Then she looks at you with a mixture of admiration and wounded professional pride.

"How thoroughly irritating."

Dinner turns out splendidly. You eat together at the little table, talking about classes, books, and the peculiar injustices of Academy life. Emma gradually abandons her injured dignity, and by the time the plates are nearly empty, she's laughing freely.

{{last_bite}}

## Passages

### last_bite

**When:** Emma love ≥ 3

Only one delicious morsel remains on the serving plate.

You both notice it at precisely the same moment.

Emma reaches for it. So do you. Your forks meet with a delicate metallic _clink_.

"Antonio."

"Emma."

"I believe," she says gravely, "that as your hostess, I ought to have the final piece."

"And as your cook, I believe I've earned it."

She considers this argument. "A regrettably strong position."

You seize the opportunity, pick up the morsel with your fingers, and smile triumphantly.

"Victory."

Emma gives you a long, thoughtful look. Then a mischievous smile appears.

"Not quite."

She catches your wrist before you can withdraw your hand, gently draws it toward her, and, without breaking eye contact, takes the morsel delicately from between your fingers with her lips.

For a brief moment, you're too astonished to move.

Emma releases your hand, chews with exquisite composure, and smiles.

"Delicious. You really are an excellent cook, Antonio."

She looks entirely too pleased with herself.

**Otherwise:**

There's barely a crumb left by the time you finish. Emma leans back in her chair, looking thoroughly satisfied.

"Well, Fibonacci. I have to concede that you've surpassed me in at least one field."

"Only one?"

"Don't get ambitious. I've already ordered a better cookbook."

She smiles over her empty plate.

"Although I may have to invite you back for further practical instruction."

## On enter

- **Character discovery — Emma's upbringing:** Emma's parents made considerable sacrifices to support her education, taking care of household responsibilities so she could devote herself to her studies. As a result, she's a surprisingly inexperienced cook.

### Option A: Prepare to leave

**Next:** card_gift

**Outcomes:**

- No additional game-state effects.

---

## Node: card_gift

As you prepare to leave, Emma retrieves a small card case from her desk.

"Before you go, there's something I'd like you to have."

She opens it, revealing several beautifully crafted cards.

"Choose one. Consider it a modest expression of gratitude for saving my dinner."

Her eyes narrow playfully.

"And not a word about this to Molly. I have a reputation to maintain."

## On enter

- **Gift:** gift card (choice from 3), pools 'emma' and 'base'
