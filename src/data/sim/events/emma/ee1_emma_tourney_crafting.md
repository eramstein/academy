# Event: Two of a Kind

**NPC:** emma  
**Event ID:** `emma_tourney_crafting`  
**Trigger:** emma_tourney_crafting event is the current activity  

**Emotion:** happy
Image: large

## Text

The Academy's artificery room is deserted at this hour, its great wooden tables and elaborate magical instruments illuminated by the last rays of evening sunlight. Emma has already prepared a workspace when you arrive, complete with ingredients, drafting tools, and two cups of something hot.

"Excellent timing, Antonio. I've managed to borrow the room for the evening, and I intend to make the most of it."

{{ crafting_plan }}

The work begins with the usual disagreements. Emma favors precision, careful calculations, and meticulous preparation. You suggest a few rather less orthodox solutions, which she initially regards with suspicion before reluctantly admitting that some of them have merit. Soon, however, the arguments give way to an easy rhythm. You begin anticipating each other's ideas, correcting mistakes before they happen, and occasionally arriving at the same conclusion simultaneously.

"Remarkable," Emma observes after one such coincidence. "We're beginning to think alike. I do hope this isn't permanent."

At last, everything is ready. The two of you stand opposite each other across the crafting table, hands extended toward the unfinished card. As your magical auras flow into the ritual, the familiar patterns of energy begin to form, then unexpectedly intertwine, circling one another in a luminous spiral.

For a moment, the entire room seems to hold its breath.

A brilliant flash illuminates the table, and the ritual ends.

Where there should have been a single creation, two identical cards now rest side by side.

Emma picks one up, examines its magical properties, and breaks into a delighted smile.

"It worked! Antonio, look at this. The balance is excellent, the enchantment is stable, and the duplication is absolutely flawless!"

She turns the card over.

Her smile freezes.

"That's... unusual."

You examine the second card. The illustration depicts the two of you together, surrounded by the magical forces you've just summoned. Emma stands close beside you, one hand resting naturally on your shoulder, while the two figures exchange a look of complete and effortless trust.

The resemblance is unmistakable. The intimacy, rather less expected.

"Is that supposed to be us?"

"Apparently." Emma examines the image with scholarly concentration. "How curious. Conjured illustrations aren't supposed to depict living people, much less their creators."

She tilts the card toward the light.

"The likeness is remarkably good, though."

{{ antonio_reaction }}

{{ emma_reaction }}

Emma places the two cards side by side, apparently determined to return to safer intellectual territory.

"Well, whatever caused this anomaly, the result is excellent. And there are two of them, so naturally we shall keep one each."

"Which one's mine?"

She studies the cards for a moment.

"An excellent question."

"You don't know?"

"Of course I know. I'm simply deciding whether you deserve the better one."

She hands you a card, keeping the other for herself. They are, as far as either of you can determine, perfectly identical.

For a moment, you both regard your newly acquired creations with considerable satisfaction.

## Conditional passages

### crafting_plan

**When:** Story tag `emma_tourney_opponent_intel` is present

She spreads Elsa's precious decklist across the table.

"I've been thinking about that weakness we discovered. Falkenheim's captain relies on overwhelming his opponents with cheap, aggressive units, but almost all of them are terribly fragile."

She points to a diagram covered in calculations.

"A low-cost spell that strikes several enemies simultaneously should dismantle his entire strategy. I've worked out the foundations, but I suspect your particular talent for unconventional solutions will be useful."

She gives you a challenging smile.

"Shall we make something he'll remember?"

**Otherwise:**

She lays out the plans for an ambitious new unit, one designed to combine offensive strength with enough versatility to remain useful against a variety of opponents.

"We don't know precisely what Falkenheim will throw at us, so I've decided we should prepare something adaptable. A formidable unit, but not one that relies on a single strategy."

She points to several unfinished diagrams.

"I've worked out most of the design, but there are still a few rather troublesome details. And I suspect your particular talent for unconventional solutions will be useful."

She gives you a challenging smile.

"Shall we make something they'll remember?"

### antonio_reaction

**When:** Story tag `emma_smitten` is present

You study the illustration again. Apparently, whatever mysterious intelligence governs the conjuration ritual has decided that you and Emma make a particularly handsome couple.

You make a heroic effort not to look pleased.

Emma notices immediately.

"Do try to contain your enthusiasm, Fibonacci. It's a card, not a marriage certificate."

**Otherwise:**

You look from the illustration to Emma, then back again. The figures seem remarkably comfortable in each other's company. Perhaps the magic has an unusually generous imagination.

Emma catches your expression.

"Don't ask me why we're standing so close together. I assure you it wasn't in the specifications."

### emma_reaction

**When:** Emma love ≥ 3

Emma sets her copy carefully beside her notes. A moment later, when she thinks your attention is elsewhere, she picks it up again.

Her eyes linger on the illustration, and a small, private smile touches her lips.

By the time you look toward her, she's examining the card's magical properties with impeccable scholarly concentration.

**Otherwise:**

Emma turns her card over once more, frowning thoughtfully.

"I should investigate what happened to our auras. Such an unusual interaction may have interesting implications for future crafting."

She pauses.

"Though perhaps we needn't mention the illustration to Professor Glützenbaum just yet."

## Effects

- Add story tag `emma_joint_creation`.
- knownTrait added for Emma: Emma and Antonio successfully combined their magical auras to create two identical cards, whose illustrations unexpectedly depict the two of them together.
- **When** story tag `emma_tourney_opponent_intel` is present:
  - gift `emma_tourney_spell` to Antonio
  - gift `emma_tourney_spell` to Emma
- **When:** story tag `emma_tourney_opponent_intel` is absent:
  - gift `emma_tourney_unit` to Antonio
  - gift `emma_tourney_unit` to Emma
- Schedule `emma_falkenheim_tournament` event for next Saturday evening (next free) at the Academy Hall.
- Schedule `emma_tourney_travel` event for next Sunday evening (next free) at the Gray Mountains.

## Options

### Option A: Claim credit for the masterpiece

**Text:**

"I must say, the card has captured my heroic qualities rather well. Your presence is a nice addition, of course."

Emma looks at you with an expression of exquisite disbelief.

"Your heroic qualities?"

"Quite unmistakable."

"Antonio, I'm fairly certain I'm the one performing the difficult magic in that picture. You appear to be providing moral support."

"An indispensable contribution."

"Naturally. I'll be sure to mention it when they erect your statue."

She turns the card over again, a mischievous smile spreading across her face.

"Though I must admit, the artist has been rather generous with your jawline."

**Outcomes:**

- Emma rivalry +1.

### Option B: Appreciate what you've created together

**Text:**

"You know, Emma, I rather like it. Not just the card. The two of us working together."

Emma looks at you, then at the illustration.

"Yes," she says after a moment. "I think I do too."

She turns the card slowly between her fingers.

"I've always preferred working alone. It's generally more efficient, and one has fewer people to disappoint." She gives you a brief, amused glance. "But I must concede that having someone capable beside me has its advantages."

"High praise."

"Don't let it go to your head."

Her smile softens.

"Seriously, Antonio. We do make a good team."

**Outcomes:**

- Emma friendship +1.

### Option C: Compliment the artist's romantic imagination

**Text:**

"I must say, the artist has excellent taste in couples."

Emma raises an eyebrow.

"Couples? How very forward of you, Fibonacci. I wasn't aware we'd progressed beyond an academic partnership."

"I'm merely appreciating the artistic interpretation."

"Naturally." She studies the illustration again. "And here I thought we were crafting a tournament card, not commissioning a romantic portrait."

"Perhaps the magic knows something we don't."

"An alarming possibility. Though I should warn you, Antonio, magical phenomena are notoriously unreliable when it comes to matters of the heart."

She gives you a wicked little smile.

"Still, I suppose there are worse people to be immortalized alongside."

You decide to accept the compliment before she has time to reconsider it.

**Outcomes:**

- Emma love +1.
