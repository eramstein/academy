# Event: An Invitation of Sorts

**NPC:** emma  
**Event ID:** `emma_ball_invitation`  
**Trigger:** `emma_trusted_companion` and `emma_ballet_incident` have occurred; thursday; morning; Emma present  
**Emotion:** amused

## Text

You arrive at the artificery classroom a little early and find Emma already at her desk, reading a letter. She looks unusually pleased with herself.

"Antonio! Excellent. I was hoping to catch you before class."

She folds the letter and sets it aside.

"Have you heard about the Academy's annual ball next Saturday? Apparently, it's quite the occasion. Music, dancing, extravagant dresses, and enough distinguished guests to populate a royal court."

You have heard something about it.

"Well, I have a particular interest in one of those guests. Lord de Varenne. An elderly gentleman, enormously respected, and one of the greatest patrons of artificery in the kingdom. He's helped launch the careers of several remarkable scholars."

Her green eyes brighten with unmistakable ambition.

"An introduction could open some very interesting doors. And I intend to make a good impression."

She pauses, then gives you a mischievous smile.

"Naturally, a young lady cannot attend such an occasion without a suitable escort. And I believe I know just the gentleman."

You look around the classroom, wondering whom she has in mind.

"Don't be obtuse, Fibonacci. I'm inviting _you_."

{{ ballet_recollection }}

"So, Antonio. Would you do me the honor of accompanying me to the ball? I promise excellent company, a respectable amount of dancing, and only a modest risk of social humiliation."

She considers that last promise.

"Well. I promise to do my best."

## Conditional passages

### ballet_recollection

**When:** Story tag `emma_ballet_flirt` is present.

She rests her chin on one hand, looking thoroughly entertained.

"After all, I remember how deeply you appreciated my ballet performance. Such an extraordinary connoisseur of the fine arts."

She pauses delicately.

"Particularly the _physique_, if memory serves. And I assure you, Antonio, I intend to look absolutely spectacular."

Her smile becomes positively wicked.

"Though you will be expected to remain capable of speech this time. We shall be in distinguished company."

**When:** Story tag `emma_smitten` is present.

"Besides, I happen to know that you're a great admirer of dancing. I remember that expression on your face when Elsa so kindly arranged our little demonstration."

She looks at you with innocent curiosity.

"Was it my technique that impressed you, I wonder? My balance? My artistic interpretation?"

Her lips twitch.

"Or were you simply overwhelmed by the beauty of classical ballet?"

**When:** Emma rivalry ≥ 3.

"And since you were so gracious about my dancing last time, I thought you might appreciate another opportunity to judge my performance."

She raises an eyebrow.

"I believe your exact words were _a little showy_. Well, Fibonacci, I intend to be positively magnificent. Try not to look too impressed."

**Otherwise:**

"And you've already seen me dance, of course. Under rather unusual circumstances, admittedly."

She smiles at the memory.

"Poor Elsa. All that trouble to arrange an audience, only to discover that everyone rather enjoyed the performance."

She gives a little shrug.

"I thought this time we might attend somewhere we're actually invited."

## Effects

- Add to Emma's known traits: **Professional ambition:** Emma hopes to meet Lord de Varenne at the Academy ball. He is a distinguished patron of artificery whose support could greatly advance her career.

## Options

### Option A: Accept the invitation

**Text:**

"An evening of excellent food, dancing, and the most promising artificer of our generation? How could I refuse?"

Emma beams.

"Splendid! I knew you'd recognize a good opportunity when one presented itself."

She retrieves a small notebook and makes a mark beside something she's already written.

"You've put me on a list?"

"Naturally. One must plan ahead."

She studies you for a moment, her expression growing thoughtful.

"Although there is one small matter we'll need to address."

"What matter?"

"Your wardrobe."

You glance down at your clothes.

"What's wrong with my wardrobe?"

"Nothing at all. For attending lectures, visiting the library, or digging potatoes."

She gives you a reassuring pat on the arm.

"Don't worry, Antonio. I'll take care of everything. Meet me in town tomorrow afternoon. We'll find you something suitable."

The professor enters, and Emma turns toward the front of the classroom with a perfectly innocent expression.

You have the distinct impression that you've just volunteered for considerably more than an evening of dancing.

**Outcomes:**

- Emma friendship +1.
- Add story tag `emma_ball_accepted`.
- Schedule `emma_ball_shopping` for the following evening in town.
- Schedule `emma_academy_ball` for next Saturday evening at the Academy ballroom.

### Option B: Politely decline

**Text:**

"I'm flattered, Emma. Truly. But I think I'll have to decline."

For a moment, she looks surprised. Then she gives a small, accepting nod.

"Of course. A pity, but I understand."

She picks up her letter again, tapping it thoughtfully against the desk.

"Well, I'll simply have to make other arrangements. It would be absurd to miss such an opportunity for want of a dancing partner."

Her familiar smile returns.

"And frankly, I was being rather generous in overlooking your questionable qualifications."

"Questionable?"

"Entirely unproven on the dance floor, Fibonacci. A considerable risk."

You laugh, and she gives you a friendly little wave as the professor enters.

"Enjoy your Saturday evening, Antonio. I shall endeavor to become rich and famous in your absence."

**Outcomes:**

- Add story tag `emma_ball_declined`.
