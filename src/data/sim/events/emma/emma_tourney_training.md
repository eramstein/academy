# Event: A Question of Strategy

**NPC:** emma  
**Event ID:** `emma_tourney_training`  
**Trigger:** emma_tourney_training event is the current acvitiy
**Emotion:** happy
** Image:** large

## Text

Emma's lodgings occupy a modest room on the upper floor of a rustic village inn. A narrow bed stands against one wall, a battered armchair occupies the other, and nearly every remaining surface has been conquered by books. A small kettle steams beside two cups on the desk. Apparently, your arrival has been anticipated with military precision.

"Seven o'clock. Excellent." Emma opens the door wider. "I was beginning to wonder whether I'd need to send a search party."

{{ greeting }}

She leads you to the desk, where two decks lie beside a rather alarming collection of tournament regulations, strategic diagrams, and handwritten notes. Evidently, Emma has not spent the afternoon idle.

"We have a few evenings before Falkenheim, and a great deal to accomplish. Unfortunately, time is a resource even I haven't yet learned to manufacture." She points to two piles of documents. "So we must choose our priorities."

"We could study our opponents, learn how they play, and prepare something unpleasant for them. Or we could concentrate on our own performance and spend tonight practicing against each other."

She smiles, with the dangerous enthusiasm of someone who considers both possibilities excellent entertainment.

"Well, partner? How shall we spend our evening?"

## Conditional passages

### greeting

**When:** Story tag `emma_smitten` is present

She catches you glancing around the room and raises an eyebrow. "Yes, Fibonacci, you've been invited into my bedroom. Do try not to faint. It's principally a place of study."

**Otherwise:**

"Make yourself comfortable. Within reason, of course. I'm afraid I haven't acquired a second armchair, so you'll have to settle for the bed or that remarkably uncomfortable stool."

## Options

### Option A: Study the opposition

**Next:** investigate_opposition

**Text:**

"If we know how they play, we can prepare a counter-strategy. Why fight them on their terms?"

"An excellent principle." Emma considers the tournament invitation again. "And I believe I know where we might begin."

Her expression brightens with a rather mischievous idea.

"Elsa Falkenstein."

**Outcomes:**

- Add story tag `emma_tourney_studied_opposition`.

### Option B: Practice against each other

**Next:** practice_session

**Text:**

"We know our own decks better than theirs. Let's put that advantage to work. A few practice games should reveal where we need improvement."

"Splendid." Emma pushes the documents aside and begins arranging her cards.

"Although I must warn you, Antonio, I have no intention of going easy on you merely because we're on the same team."

You wouldn't dream of asking.

**Outcomes:**

- Add story tag `emma_tourney_chose_practice`.

---

## Node: investigate_opposition

**Title:** Know Your Enemy  
**Emotion:** amused

Emma explains that Elsa Falkenstein comes from Falkenheim itself, and that her older brother is widely regarded as the Royal College's most promising first-year student.

"He's almost certainly their captain. And Elsa knows him rather well, as siblings unfortunately tend to."

"Then we should ask her."

"Yes." Emma purses her lips. "There's just one small complication."

She reminds you of that unfortunate incident at the ballet, when Elsa attempted to make a spectacle of her and ended up providing the entertainment herself.

"I doubt she's forgiven me. Which is rather unfair, since I wasn't the one who arranged the whole thing."

A short walk brings you to Elsa's lodgings, in an inn whose polished marble entrance and liveried servants suggest an establishment considerably more prosperous than Emma's. Elsa receives you in a beautifully furnished sitting room, where she listens to your explanation with growing amusement.

"So. The illustrious Emma Delamain has come to ask for _my_ assistance."

"Information, Elsa. Not divine intervention."

"How disappointing. I was rather looking forward to the latter."

Elsa settles into her upholstered chair, crossing one leg elegantly over the other.

"My brother is an exceptional player. I know his preferred cards, his strategies, even his latest decklist." She smiles. "But why, exactly, should I share any of that with you?"

### Option A: Appeal to Elsa's school pride

**Check:** charisma extremely hard

**On success:**

**Next:** training_conclusion

**Text:**

"Elsa, surely you'd rather see your own Academy win than have Falkenheim boast about humiliating it. Imagine having to listen to your brother recount his triumph every time you visit home."

Elsa's expression changes.

"You clearly haven't met my brother. He'd mention it at breakfast, lunch, dinner, and probably in his sleep."

She considers the matter for another moment, then opens a drawer and produces a carefully folded sheet.

"Very well. Purely in the interest of preserving my future domestic tranquility. This is the decklist he sent me last week."

Emma accepts it with evident satisfaction.

"How very generous of you, Elsa."

"Don't make me regret it."

**Outcomes:**

- Add story tag `emma_tourney_opponent_intel`.
- Elsa friendship +1.
- Emma friendship +1.

**On failure:**

**Next:** training_conclusion

**Text:**

"Elsa, surely you'd rather see your own Academy win than have Falkenheim boast about humiliating it."

"Of course I would." Elsa smiles pleasantly. "And I shall be cheering for you with tremendous enthusiasm."

"And the information?"

"Oh, I couldn't possibly betray my dear brother's confidence. Family loyalty, you understand."

Emma's jaw tightens. For a moment, you think she's about to deliver a reply that will end the conversation rather spectacularly.

Instead, she takes a breath.

"Very well, Elsa. What would you want in exchange?"

Elsa sits up, suddenly interested.

"Oh?"

"A favor. From both of us. Something reasonable, to be agreed upon when you need it."

Elsa studies the two of you in delighted silence. Her gaze travels from Emma to you and back again, as though assessing a pair of newly acquired servants.

"How _interesting_." She taps a finger against her lips. "The brilliant Emma Delamain and her promising young associate, both at my disposal. I must say, the possibilities are rather intoxicating."

"Within reason," Emma repeats firmly.

"Naturally, darling. I would never dream of asking anything unreasonable."

Something about the way she says this makes you profoundly uneasy.

Elsa retrieves a folded decklist from her desk and hands it to Emma.

"There you are. Now, I shall have to think very carefully about what to ask of you."

As you leave the inn, you turn to Emma.

"Are you sure this was a good idea? What do you think she's going to want?"

"I haven't the faintest idea."

"That doesn't worry you?"

"Not particularly. We've obtained what we came for."

She unfolds the decklist and begins studying it as she walks.

"Honestly, Antonio, do try to concentrate on the important things."

**Outcomes:**

- Add story tag `emma_tourney_opponent_intel`.
- Add story tag `elsa_favor_owed`.
- Emma friendship +1.

### Option B: Try to outwit Elsa

**Check:** intelligence extremely hard

**On success:**

**Next:** training_conclusion

**Text:**

"Your brother must be an excellent strategist," you remark. "I imagine he's already prepared something to counter our Academy's usual defensive decks."

Elsa gives a dismissive little laugh.

"Defensive decks? Please. He'd overwhelm those before they could establish themselves. His sacrificial combinations are quite impossible to—"

She stops.

You smile.

Emma's expression becomes one of profound appreciation.

"Elsa," she says gently, "I believe Antonio was asking a question."

Elsa stares at you both.

"I despise clever people."

"An unfortunate prejudice," Emma replies, "particularly at an Academy."

You continue the conversation, carefully encouraging Elsa to correct your increasingly inaccurate guesses about her brother's strategy. Eventually, exasperated by your apparent ignorance, she snatches a sheet of paper from her desk.

"Oh, for heaven's sake. Here! This is his decklist. Perhaps you'll understand what I'm talking about when you see it."

Emma accepts the document with a gracious smile.

"How very instructive. Thank you, Elsa."

It is only as you rise to leave that Elsa seems to reconsider the entire conversation.

"Wait a moment..."

**Outcomes:**

- Add story tag `emma_tourney_opponent_intel`.
- Emma respect +1.
- Emma rivalry +1.
- Elsa rivalry +1.

**On failure:**

**Next:** training_conclusion

**Text:**

You begin probing Elsa's knowledge with what you consider a series of subtle questions.

Unfortunately, Elsa proves rather less susceptible to subtlety than you'd hoped.

"Antonio, darling, if you want to know my brother's strategy, you could simply ask." She smiles. "I would still refuse, naturally, but we'd save ourselves so much time."

Emma hides a smile behind her hand.

"An admirable attempt, Fibonacci. Perhaps we should try a less elaborate approach."

She turns to Elsa, her expression becoming unusually serious.

"All right. What would it take for you to give us that decklist?"

Elsa arches an eyebrow.

"Are you offering to beg?"

"Don't be absurd. I'm offering you a favor. From both of us, whenever you might need it."

You turn toward Emma, rather alarmed by the sudden generosity of this proposal.

Elsa, meanwhile, looks as though someone has just presented her with a particularly magnificent birthday gift.

"Both of you?" She studies you in turn, her smile widening. "My dear Emma, I had no idea you could be so accommodating."

"Do you accept or not?"

"Oh, absolutely."

She opens a drawer, retrieves a folded sheet, and hands it to Emma with considerable ceremony.

"One complete decklist, as requested. And two exceptionally talented Academy students owing me a favor. What a delightful afternoon."

On the way back, you finally manage to interrupt Emma's enthusiastic examination of the document.

"Emma. About that favor..."

"Yes?"

"We have absolutely no idea what Elsa is going to ask us to do."

"No."

"And you don't find that concerning?"

Emma looks up at you, apparently surprised.

"Antonio, we have the decklist. We can worry about everything else after we've won."

You are beginning to suspect that Emma Delamain's attitude toward risk depends rather heavily on whether she considers the objective sufficiently glorious.

**Outcomes:**

- Add story tag `emma_tourney_opponent_intel`.
- Add story tag `elsa_favor_owed`.
- Emma rivalry +1.

---

## Node: practice_session

**Title:** Practice Makes Perfect  
**Emotion:** happy

The first game begins innocently enough.

Within minutes, Emma is leaning over the table, studying your cards with the concentration of a chess master contemplating the invasion of a small country. She makes no secret of her pleasure whenever she finds a weakness in your defenses, and considerably less of her displeasure when you exploit one of hers.

One game becomes three. Then five. You experiment with unfamiliar openings, exchange decks to understand each other's strengths, and argue over the merits of various strategies with increasing enthusiasm.

At some point, Emma forgets to pour the tea. At another, she forgets to drink it.

By the time the innkeeper knocks to ask whether you intend to order supper, both of you have become quite determined to win the next game.

## On enter:

- Add story tag `emma_tourney_practiced`.
- Add story tag `emma_tourney_emma_prepared`.

### Option A: Play one final, decisive game

**Check:** intelligence hard

**On success:**

**Next:** training_conclusion

**Text:**

The final game is a masterpiece of accumulated cunning. Emma anticipates your opening, you anticipate her response, and the two of you spend several turns laying traps for someone who is doing precisely the same thing.

Then you spot an opportunity.

Emma studies the board, narrows her eyes, and slowly looks up at you.

"Oh, that is _vile_."

You make your move.

She stares at the cards for another moment, then throws back her head and laughs.

"Well played, Antonio. Infuriatingly well played."

"I believe that's what they call a compliment."

"Don't become accustomed to it. I intend to rectify the situation at the earliest opportunity."

**Outcomes:**

- Add story tag `emma_tourney_practice_antonio_won`.
- Emma respect +1.
- Emma rivalry +1.

**On failure:**

**Next:** training_conclusion

**Text:**

For a glorious moment, you believe you have her cornered.

Then Emma plays a card you had entirely forgotten was in her deck.

You examine the board. You examine your hand. You examine the board again, in the faint hope that one of its features might have changed out of courtesy.

"Checkmate," Emma announces.

"Wrong game."

"An insignificant technicality." She leans back with a triumphant smile. "Would you like me to explain where you went wrong?"

"Would you enjoy that?"

"Immensely."

She does, however, spend the next several minutes explaining her winning combination, and together you identify several adjustments that could strengthen your tournament decks.

**Outcomes:**

- Add story tag `emma_tourney_practice_emma_won`.
- Emma friendship +1.
- Emma rivalry +1.

---

## Node: training_conclusion

**Title:** The Deciding Match  
**Emotion:** happy

{{ preparation_recap }}

It is now quite late. The village has grown quiet outside the windows, and the innkeeper has extinguished most of the lights downstairs. Emma tidies the table with practiced efficiency, gathering the scattered notes and cards into neat piles.

"Well. I think we've made excellent progress."

She pours the last of the tea, discovers that it is cold, and drinks it anyway.

"There's one final question we should settle."

She retrieves the tournament regulations.

"Two matches. I'll face Falkenheim's captain, and you'll face their second. If we win one each, there will be a deciding match. We must nominate which of us will play it."

{{ finalist_preference }}

She sets down the regulations and looks at you.

"What do you think, Antonio? Which of us should have the honor?"

**Passages:**

### preparation_recap

**When:** Story tag `emma_tourney_opponent_intel` is present

Back in Emma's room, you spread Elsa's precious decklist across the table. It is an intimidating collection of aggressive creatures, sacrificial combinations, and devastating offensive abilities.

Emma studies it in silence, occasionally making a small annotation.

"Interesting. Very interesting. He clearly favors overwhelming his opponents before they can establish themselves."

She begins arranging cards into groups.

"Look at these units. Fast, cheap, dangerous... but almost none of them can survive a proper hit."

She sits back, her eyes brightening.

"Antonio, I think I've found something."

She points to the fragile creatures that form the backbone of the opposing deck.

"A single powerful defender wouldn't help us. He could simply overwhelm it. But a spell that strikes _every_ enemy unit at once, even for a modest amount of damage..."

You look again at the decklist.

"Would wipe out most of his forces."

"Precisely!"

Emma smiles with the fierce satisfaction of someone who has just discovered a particularly elegant solution to an unpleasant problem.

"We need a cheap spell that damages several units simultaneously. Something we can deploy before his offensive gets out of hand."

She takes a fresh sheet of parchment and begins sketching possibilities.

"I think, Antonio, that we have just discovered what we'll be crafting together."

**When:** Story tag `emma_tourney_practice_antonio_won` is present

You finish reviewing the evening's games, including your particularly satisfying final victory. Emma is still disputing one of your moves, although her argument has gradually shifted from claiming it was unsound to complaining that she hadn't thought of it first.

"Some of your combinations were genuinely clever," she admits. "I've been making notes. If I can incorporate a few of those ideas into my own play, Falkenheim may find me a rather unpleasant opponent."

**When:** Story tag `emma_tourney_practice_emma_won` is present

You finish reviewing the evening's games. Emma has won the final encounter, a fact she has mentioned only three times in the last quarter of an hour.

"Your defense improved considerably toward the end," she observes. "And you forced me to reconsider several combinations I thought I knew perfectly well."

She smiles.

"I believe the evening has been most educational. For both of us."

**Otherwise:**

You finish reviewing your preparation notes together. There is still much to do before the tournament, but at least you now have a clearer idea of what lies ahead.

### finalist_preference

**When:** Antonio won the most recent internal Academy league

"I've considered it carefully," Emma says. "Given your performance in the last league, I think you ought to take the deciding match."

She delivers this judgment with perfect composure, though you suspect conceding the point has cost her something.

"Don't look so astonished, Fibonacci. I can recognize superior results when they are placed directly under my nose."

She smiles.

"Besides, I intend to win my own match. With any luck, you won't be needed."

**Otherwise:**

"I propose that I take the deciding match," Emma says. "I've been preparing for this competition rather obsessively, and I believe I'm our strongest choice."

She pauses, then adds more thoughtfully:

"But you're my partner, not my subordinate. If you see it differently, I'm willing to hear your argument."

### Option A: Volunteer for the deciding match

**Text:**

"I'll take it. Whatever happens in the first two matches, I want to be the one who settles the score."

Emma studies you for a moment, then smiles.

"Very well. I hope you appreciate the magnitude of the responsibility you've just volunteered to assume."

"I thought you wanted someone ambitious."

"I do. But ambition without competence is merely a particularly entertaining form of self-destruction."

She extends her hand.

"Don't disappoint me, Fibonacci."

You shake it.

"Wouldn't dream of it."

**Outcomes:**

- Add story tag `emma_tourney_finalist_antonio`.
- Emma respect +1.
- Schedule `emma_tourney_crafting` event for evening in 2 days (next free) at the artificery room.

### Option B: Let Emma take the deciding match

**Text:**

"You're the captain. And I trust you to handle the final if it comes to that."

Emma regards you thoughtfully.

"How remarkably sensible of you."

"Try not to sound so surprised."

"I'm doing my best."

She smiles, but there's genuine appreciation behind the teasing.

"Very well. I'll take the deciding match. You concentrate on beating their second, and leave the other one to me."

She offers her hand across the table.

"Agreed?"

"Agreed."

**Outcomes:**

- Add story tag `emma_tourney_finalist_emma`.
- Emma friendship +1.
- Schedule `emma_tourney_crafting` event for evening in 2 days (next free) at the artificery room.
