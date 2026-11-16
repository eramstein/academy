# Event: A Taste of Freedom

**NPC:** emma  
**Event ID:** `emma_financial_freedom`  
**Trigger:** Story tag `emma_financial_independance` ≥ 8; evening; Emma is present  
**Emotion:** happy

## Text

You're crossing the Academy hall when Emma intercepts you, wearing an expression of such undisguised satisfaction that you immediately suspect she's won something.

"Antonio! Just the man I was looking for."

"Should I be worried?"

"Not unless you've developed an objection to good news." She produces a folded letter and waves it triumphantly. "It's done. The bank is satisfied, my tuition is secure, and for the first time in years, I can look at my finances without experiencing the urge to commit a violent crime against an accountant."

She laughs, and there's something wonderfully carefree about it. You realize you haven't seen her quite like this before.

{{ tournament_memory }}

{{ ball_memory }}

{{ tutoring_memory }}

{{ loan_memory }}

"Anyway, I haven't come to bore you with my accounts. Quite the opposite." She folds the letter and slips it into her bag. "You've been a good friend to me, Antonio. And now that I'm finally in a position to do something about it, I intend to show my appreciation."

You begin to protest, but she raises a finger.

"No false modesty, please. I've spent entirely too long worrying about money. Tonight, I'd like to enjoy having some."

Her eyes sparkle.

"Now, I've considered three possible rewards for my distinguished benefactor. Being a generous and enlightened woman, I shall even allow him to choose."

## Conditional passages

### tournament_memory

**When:** Story tag `emma_tournament_win` is present

"That tournament at Falkenheim certainly helped. The prize money was rather splendid, but I think the expression on their director's face was worth almost as much."

She smiles at the memory.

"And I couldn't have done it without my partner. Well, I probably could have, but it would have been considerably less entertaining."

**Otherwise:**

### ball_memory

**When:** Story tag `emma_ball_shared_evening` is present

"And that evening at the ball! Who would have thought an evening of polite conversation and dreadful dancing would lead to such a valuable patron?"

She gives you an appreciative look.

"Your company turned out to be an excellent investment. Though I hope you won't start charging an escort fee."

**Otherwise:**

### tutoring_memory

**When:** Story tag `molly_memory_emma_referral` is present

"And Molly's tutoring work has been a blessing. Imagine that! People actually paying me to explain things I would otherwise have explained for free."

She pauses.

"Although I suppose I have you to thank for the introduction. You do occasionally have excellent ideas, Fibonacci."

**Otherwise:**

### loan_memory

**When:** Story tag `emma_loan_solution_found` is present

"And of course, sorting out that dreadful loan gave me the breathing room I needed. Without it, I might have lost everything before the other opportunities came through."

Her expression softens.

"I haven't forgotten the trouble you took for me, Antonio."

**Otherwise:**

## Effects

- Add to Emma's known traits: **Financial independence:** Emma has finally secured her place at the Academy and overcome her immediate financial difficulties. Her growing success as an artificer has given her the freedom to enjoy some of the rewards of her hard work.

## Options

### Option A: Accept a share of her success

**Text:**

"Well, since you insist, I suppose a financial contribution would be the most practical arrangement."

"Practical! Excellent. I knew there was a sensible man hiding somewhere beneath that magnificent head of yours."

Emma produces a small purse and places it in your hand.

"Two hundred gold. Consider it a dividend on your investment in Emma Delamain."

"That's rather generous."

"Nonsense. It's a perfectly reasonable sum." She pauses, then smiles. "Besides, I rather enjoy being the wealthy one for a change."

She looks immensely pleased with herself as you accept the money.

"Spend it wisely, Antonio. Or at least buy something interesting enough that I can criticize your choice afterward."

**Outcomes:**

- Give Antonio 200 gold.
- Add story tag `emma_financial_reward_gold`.

### Option B: Choose one of her cards

**Text:**

"I think I'd rather have one of your cards. Something to remember your success by."

Emma's expression brightens immediately.

"Ah! A man of taste. I approve."

She opens her card case and carefully selects three creations, laying them before you.

"These are some of my recent works. I'm rather proud of them, actually. You may choose whichever you like."

You examine the cards, appreciating the meticulous craftsmanship and elegant enchantments.

"Are you sure you want to part with one?"

"Antonio, please. I can always make another." She smiles. "And I rather like the idea of you defeating our opponents with something I created."

You make your selection.

"An excellent choice," Emma declares. "Though naturally, I would have chosen differently."

"Naturally."

"Now, don't go losing to me with it. That would be terribly embarrassing for both of us."

**Outcomes:**

- Present 3 randomly selected cards from the `emma` and `base` card pools.
- Antonio chooses one and receives it as a gift.
- Add story tag `emma_financial_reward_card`.

### Option C: Let her surprise you

**Next:** courtyard_picnic

**Text:**

"Actually, I think I'd prefer something less practical. How about dinner together?"

Emma looks delighted.

"Oh, splendid! I was hoping you'd choose that one."

"You were?"

"Absolutely. The other two were perfectly respectable offers, of course, but this one required considerably more planning."

"Planning?"

She takes your arm with an air of great importance.

"Come along, Fibonacci. I've arranged something rather special."

"Where are we going?"

"A little patience, Antonio. I promise not to sell you to passing merchants."

"Reassuring."

"Not for lack of offers, mind you."

**Outcomes:**

- Add story tag `emma_financial_reward_picnic`.

---

## Node: courtyard_picnic

**Title:** A Feast Fit for Two  
**Image:** emma_courtyard_picnic.jpg large  
**Emotion:** happy
**Image:** emma_financial_freedom.jpg large

**On enter:**

- Move Antonio and Emma to `academy-courtyard`.
- Emma love +1.

Emma leads you into the Academy courtyard, where the last traces of daylight linger among the trees. The place is almost deserted, and the evening air is pleasantly cool.

She stops beside a secluded patch of grass, beneath an old chestnut tree.

"Here we are!"

You look around. A bench, some grass, a few flowers. Very nice, certainly, but hardly the grand celebration you'd been led to expect.

"A picnic?"

"Precisely!"

You attempt to arrange your features into an expression of appropriate enthusiasm. Emma watches you for a moment, then bursts out laughing.

"Oh, Antonio! Your face! You thought I was going to reward you with a piece of bread and a pleasant view, didn't you?"

"Not at all. I'm very fond of grass."

"Of course you are. Now, would you mind helping me with that basket?"

You turn to discover an enormous wicker basket concealed behind the bench. Emma opens it, and what follows is a revelation.

Out comes a spotless linen tablecloth, followed by two delicate porcelain plates, polished silver cutlery, and a pair of crystal glasses. Then the food begins to emerge: thin slices of smoked salmon, a magnificent pâté, fresh bread still warm from the baker's oven, several varieties of excellent cheese, ripe figs, grapes, and an assortment of little pastries so exquisitely decorated that you hesitate to call them food.

And then, with a triumphant flourish, she produces a bottle of fine French wine.

You stare at the growing banquet.

"Emma... where on earth did you get all this?"

"I went shopping."

"I can see that."

"At the best establishments in town, naturally. I even persuaded the innkeeper to procure a few things specially."

She examines the arrangement critically, adjusts a plate by half an inch, and finally nods with satisfaction.

"There. I think that will do."

You sit down together, and Emma pours the wine with the solemn precision of a woman conducting an important magical experiment.

You take a bite of the pâté.

Oh.

_Oh, good heavens._

Apparently, this is what wealthy people eat while the rest of humanity is busy chewing its way through boiled vegetables.

Emma watches your reaction with obvious delight.

"Good?"

"Emma, I believe I may have been eating incorrectly my entire life."

"How tragic. Twenty-three years of culinary deprivation."

You sample the salmon, then one of the cheeses. Each proves more extraordinary than the last. Emma is clearly enjoying herself as much as you are, though you suspect much of her pleasure comes from watching you discover these delicacies.

Eventually, you lean back against the tree, feeling pleasantly full.

"This must have cost you a fortune."

"Not quite a fortune." Emma swirls the wine in her glass. "Though rather more than I would have dared spend a few months ago."

She looks down at the elaborate spread, then smiles to herself.

"You know, Antonio, I've spent so many years counting every coin. Every purchase had to be justified. Every little indulgence was something I might regret when the next bill arrived."

She takes a sip of wine.

"And now... well, I can afford a ridiculous picnic. I can buy good wine, eat expensive cheese, and spend an entire evening doing absolutely nothing useful."

She looks at you, her smile growing warmer.

"And the remarkable thing is that I don't feel the slightest bit guilty about it."

For a while, you simply enjoy the food, the wine, and the quiet evening. Emma seems unusually relaxed, her customary sharpness softened by contentment, though thankfully not entirely extinguished.

She selects a particularly beautiful little chocolate pastry and places it on your plate.

"Here. Try this one."

"Another?"

"Naturally. I didn't go to all this trouble just to watch you exercise restraint."

You oblige. It's magnificent.

Emma leans back, looking thoroughly satisfied.

"I believe I could become accustomed to this sort of extravagance."

"Shall I expect another banquet next week?"

"Certainly not. I'm financially independent, Antonio, not financially irresponsible."

She pauses thoughtfully.

"Although... perhaps next time we could try the restaurant by the town square. I've heard the chef is exceptional."

She catches your expression and smiles mischievously.

"Don't look so alarmed. I haven't forgotten how to live modestly."

She raises her glass toward you.

"To hard work, good fortune, and the occasional completely unnecessary luxury."

You touch your glass to hers.

"And to Emma Delamain."

For once, she doesn't respond with a clever remark. She simply smiles, her green eyes warm in the fading light.

"Thank you, Antonio."

The evening continues beneath the chestnut tree, and for the first time since you've known her, Emma seems to have nowhere else she'd rather be.

**On completion:**

- Add memory `emma_memory_financial_picnic` for emma: Emma smiles when you mention expensive food. "I've been thinking about that picnic, Antonio. Particularly your expression when you tasted the pâté. I don't believe I've ever seen anyone look quite so astonished by a piece of food." You suggest that she may have permanently ruined ordinary dinners for you. "Oh, nonsense. A little luxury is good for the soul. In moderation, naturally. Though I might make an exception for the chocolate pastries."
