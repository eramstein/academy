# Event: The Best-Laid Plans

**NPC:** emma  
**Event ID:** `emma_academy_ball`  
**Trigger:** Scheduled activity `emma_academy_ball`  
**Image:** large  
**Emotion:** happy

## Text

The Academy's grand ballroom is a magnificent sight. Hundreds of candles illuminate the vaulted ceiling, their light reflected in towering mirrors and polished marble. Musicians perform from an elevated gallery, while elegantly dressed guests mingle beneath chandeliers that probably cost more than your entire education.

You adjust your collar, check that Emma's silver cravat pin is properly secured, and survey the gathering.

{{ outfit_reaction }}

You've barely finished admiring the surroundings when a familiar voice calls from behind you.

"Antonio!"

You turn.

And for a moment, you forget what you were going to say.

Emma stands at the entrance to the ballroom, wearing a breathtaking gown of deep emerald silk. The elegant cut accentuates her tall, graceful figure, while delicate silver embroidery catches the candlelight whenever she moves. Her long, wavy hair falls loosely over one shoulder, and a pair of familiar green gemstones glitters at her ears.

She looks absolutely stunning.

{{ emma_entrance }}

Emma approaches, clearly delighted by the effect of her entrance.

"Well, Fibonacci? Shall we?"

She offers you her hand.

"After all, we didn't spend an entire afternoon turning you into a gentleman merely to have you stand about admiring the architecture."

## Conditional passages

### outfit_reaction

**When:** Story tag `emma_ball_outfit_magnificent` is present.

Your magnificent blue velvet attire has already attracted several admiring glances. One elderly lady even mistakes you for the son of a visiting count, a misunderstanding you are in no particular hurry to correct.

**When:** Story tag `emma_ball_outfit_distinguished` is present.

Your finely tailored evening suit has proved an excellent investment. You look every inch a respectable young gentleman, and for once, nobody seems inclined to question your presence among such distinguished company.

**Otherwise:**

Your new clothes fit comfortably and look perfectly respectable. Some of the guests are considerably more extravagantly dressed, but you suspect a few of them have spent the equivalent of a small house on their appearance.

### emma_entrance

**When:** Story tag `emma_smitten` is present.

"Oh, Emma. You look... I mean, that dress is... Good heavens."

A splendid speech. Truly worthy of the occasion.

Emma's smile widens. She steps closer, apparently taking considerable pleasure in your predicament.

"Antonio, darling, do try to remember how to breathe."

She turns gracefully, letting the silk of her gown flow around her.

"Well? I take it you approve?"

"Emma, you're magnificent."

This time, the words emerge without hesitation. She looks at you, and her teasing expression softens into something unexpectedly warm.

"Thank you, Antonio. That's very sweet."

For a moment, she seems almost shy. Then she gives you a mischievous smile.

"And here I was, beginning to worry that you'd developed an immunity to my charms. How reassuring to discover that your appreciation of _physique_ remains undiminished."

**Otherwise:**

"Emma! You look wonderful."

She smiles, visibly pleased.

"Thank you, Antonio. You look rather splendid yourself."

She gives your outfit an approving glance.

"I must say, my efforts at the tailor's have been amply rewarded."

"You mean _my_ efforts. I was the one who had to endure the fittings."

"An indispensable contribution, certainly. Standing still is an art, and you've made remarkable progress."

## Effects

- Move Antonio and Emma to the Academy ballroom.
- Add to Emma's known traits: **A taste for elegance:** Emma enjoys dancing, beautiful clothes, and sophisticated company, although she usually considers such pleasures secondary to her professional ambitions.

When: Story tag `emma_smitten` is present

- Emma love +2.

## Options

### Option A: Join Emma on the dance floor

**Next:** the_dance

**Text:**

You take her hand and lead her toward the dancers.

Emma smiles.

"Excellent. And do remember, Antonio, the object is to move _with_ your partner, not to defeat her."

"That wasn't my intention."

"Good. I find competitive dancing terribly exhausting."

**Outcomes:**

- No additional game-state effects.

---

## Node: the_dance

**Title:** An Excellent Evening  
**Image:** large  
**Emotion:** happy

The orchestra begins a graceful waltz, and Emma moves effortlessly into your arms.

Dancing with her is a rather different experience from watching her practice ballet. She moves with such natural elegance that the steps seem almost to arrange themselves around her. When you hesitate, a subtle pressure from her hand or a barely perceptible shift of her weight guides you back into rhythm.

"Very good, Antonio," she murmurs. "You're doing splendidly."

"Surprised?"

"A little. I had prepared several encouraging remarks about perseverance and the dignity of failure."

"How disappointing for you."

"Devastating."

She laughs, and the two of you continue dancing.

One waltz becomes another. Between dances, you sample the excellent refreshments, exchange observations about the more extravagant guests, and occasionally find yourselves struggling to conceal your amusement at the elaborate rituals of polite society.

At one point, a particularly pompous gentleman delivers a lengthy speech about the declining standards of modern artificery, apparently unaware that Emma has published work contradicting nearly everything he says.

She listens with perfect courtesy.

"How fascinating," she tells him afterward. "I had no idea the field had advanced so little since your retirement."

You are forced to hide your laughter behind a glass of sparkling wine.

By the time the musicians pause for an interval, you've spent a remarkably enjoyable evening together.

Emma looks positively radiant.

Then, quite suddenly, she remembers something.

"Oh! Good heavens, Antonio. Lord de Varenne!"

She searches the room with renewed purpose.

"I've been having such a wonderful time that I'd almost forgotten why I came!"

She catches sight of a familiar heraldic emblem near the far end of the ballroom.

"There! Come along. I believe that's his family crest."

### Option A: Accompany Emma

**Next:** the_patron

**Text:**

You offer Emma your arm, and together you make your way through the crowded ballroom.

"Ready to conquer another corner of the civilized world, Delamain?"

"Naturally."

She gives you a determined smile.

"Although I do hope this conquest involves fewer casualties than our last tournament."

**Outcomes:**

- Emma friendship +1.

---

## Node: the_patron

**Title:** A Distinguished Gentleman  
**Image:** medium  
**Emotion:** neutral

The gentleman standing beneath the de Varenne family crest is not remotely as old as Emma expected.

In fact, he appears scarcely older than thirty.

Tall, impeccably dressed, and possessed of the easy confidence of someone who has never had to worry about the cost of an evening's entertainment, he is speaking with a small group of Academy professors.

Emma hesitates.

"That's... not Lord de Varenne."

The gentleman notices your approach and offers a courteous smile.

"Good evening. May I help you?"

Emma recovers immediately.

"Forgive the interruption. I am Emma Delamain, a first-year student of artificery. I had hoped to meet Lord de Varenne this evening."

"Ah! My father, I presume?"

He smiles.

"I'm afraid he has decided that Academy balls are better suited to people whose knees still function properly. He sent me in his place."

He offers a slight bow.

"Lucien de Varenne. A pleasure, Mademoiselle Delamain."

Emma introduces you as well, and Lucien greets you with equal courtesy.

"Delamain..." he repeats thoughtfully. "Now, where have I heard that name?"

His expression brightens.

"Of course! The Falkenheim tournament. You represented the Academy, didn't you?"

Emma smiles.

"Indeed I did."

"Excellent! I've heard rather interesting things about your work. My father still takes a great interest in promising young artificers, and I've recently begun assisting him with some of his research initiatives."

He proceeds to ask Emma several surprisingly perceptive questions about her studies, her preferred branches of magic, and her ambitions after graduation.

Within minutes, they are discussing advanced enchantment techniques with such enthusiasm that you begin to wonder whether either remembers the orchestra is playing.

Lucien is clearly impressed.

And not, you notice, entirely by her scholarship.

His compliments are impeccably polite, but he seems particularly attentive to Emma's smile, and he finds a remarkable number of excuses to address her directly.

{{ patron_reaction }}

Then Lucien's expression grows more serious.

"Mademoiselle Delamain, I wonder whether you might be interested in a rather unusual opportunity."

## Passages

### patron_reaction

**When:** Story tag `emma_smitten` is present.

You watch Lucien smile at Emma, and Emma smile politely in return.

Well. This is unfortunate.

He is handsome, wealthy, charming, impeccably connected, and apparently capable of discussing advanced artificery without sounding like an idiot.

You begin to suspect the universe has developed a personal interest in making your life difficult.

**Otherwise:**

Lucien certainly seems to have taken an interest in Emma, and not exclusively in her scholarly accomplishments. You wonder whether she has noticed.

Knowing Emma, she probably has.

The more interesting question is what she intends to do about it.

### Option A: Hear the proposal

**Next:** the_offer

**Text:**

Emma leans forward slightly, her eyes bright with curiosity.

"An opportunity, Monsieur de Varenne? I'm listening."

Lucien smiles.

"I rather hoped you would be."

**Outcomes:**

- No additional game-state effects.

---

## Node: the_offer

**Title:** An Unexpected Opportunity  
**Image:** medium  
**Emotion:** surprised

"My family sponsors a number of research initiatives," Lucien explains. "One of them involves a small group of senior artificers working on advanced magical synthesis. Exceptional scholars, every one of them. They're currently looking for a promising younger collaborator."

Emma's expression changes at once.

"Which artificers?"

Lucien names three renowned masters of the discipline.

Emma stares at him.

"Professor Armand? _The_ Professor Armand?"

"The very same."

For a moment, she looks as though someone has just offered her the keys to the Royal Library.

Then she regains her composure.

"That's an extraordinary opportunity. But surely such a project would require a considerable commitment?"

"Indeed. It would involve regular correspondence, occasional travel, and a substantial amount of independent research. The compensation is modest, I'm afraid, but the experience would be invaluable. And my father has always been generous with recommendations for those who distinguish themselves."

Emma considers this carefully.

Lucien continues.

"Naturally, I would be delighted to discuss the arrangements in greater detail. Perhaps you might visit our residence sometime? I could show you the family's collection, and we might continue our conversation over dinner."

He smiles warmly.

"I confess, Mademoiselle Delamain, that I would find your company most agreeable."

Emma returns his smile with perfect courtesy, although you notice that she doesn't immediately accept the invitation.

"That is very kind of you, Monsieur de Varenne. Might I have a moment to consider?"

"Of course. Take all the time you need."

She draws you aside, just beyond earshot.

"Well, Antonio. This is rather unexpected."

Her excitement is unmistakable.

"Working with Armand and his colleagues! Can you imagine? I could learn more in a few months than most students manage in years."

Then her expression grows thoughtful.

"Although it would consume an enormous amount of time. And the compensation is hardly enough to justify neglecting my studies."

She glances back toward Lucien.

"He's certainly charming, isn't he?"

You make a noncommittal sound.

Emma gives you a sidelong look, but mercifully refrains from commenting.

"Anyway. You're the one person here whose judgment I trust. What do you think? Should I accept, or try to negotiate something else?"

## Options

### Option A: Encourage the long-term opportunity

**Next:** the_last_dance

**Text:**

"Emma, this is exactly the sort of opportunity you've been working toward. Learning directly from people like Armand? You'd be mad to pass it up."

She considers your words, then slowly smiles.

"Yes. You're right."

"Of course I am."

"Do try not to ruin the moment, Antonio."

She laughs, then turns back toward Lucien.

"Monsieur de Varenne, I've considered your proposal. I would be delighted to participate."

"Wonderful!"

Lucien looks genuinely pleased.

"I shall arrange the introductions immediately. I believe you'll find the work fascinating."

Emma thanks him warmly. When he excuses himself to speak with another guest, she turns toward you, her eyes shining.

"Antonio. Professor Armand! I can hardly believe it."

"I noticed."

She catches your arm and gives it an excited squeeze.

"Oh, this could be extraordinary. Just think of everything I might learn!"

For once, her usual composure has given way entirely to enthusiasm.

You can't help smiling.

**Outcomes:**

- Add story tag `emma_ball_senior_research`.
- Emma respect +1.
- Emma friendship +1.

### Option B: Negotiate a shorter commission

**Next:** the_last_dance

**Text:**

"It's an extraordinary offer, Emma. But you're already doing remarkably well at the Academy. Wouldn't it be better to concentrate on your studies for now?"

She frowns thoughtfully.

"Perhaps. Although the opportunity to work with Armand..."

"Could come again. Especially if you continue distinguishing yourself here."

Emma considers this for a moment.

Then her eyes brighten.

"Actually... I may have an idea."

She turns toward Lucien.

"Monsieur de Varenne, your proposal is extremely generous. Unfortunately, my academic commitments would make a long-term collaboration rather difficult at present."

Lucien looks disappointed.

"A pity. I had hoped—"

"However," Emma continues smoothly, "I wonder whether your family might be interested in commissioning a smaller piece of work?"

She explains that she has been experimenting with several promising enchantment techniques, but that certain rare ingredients remain prohibitively expensive. With the appropriate materials, she believes she could produce something quite exceptional.

Lucien listens with growing interest.

"A commissioned card, then?"

"Precisely. I could complete the work during the coming weeks, without neglecting my studies. You would receive the finished creation, and I would gain the opportunity to demonstrate my abilities."

Lucien considers the proposal.

"An interesting arrangement. I believe we could accommodate that."

He names a generous allowance for materials.

Emma's eyes widen almost imperceptibly.

"That would be entirely satisfactory."

They shake hands.

As you walk away, she turns toward you with an expression of barely suppressed triumph.

"Antonio. Do you have any idea what I can make with those ingredients?"

"Something impressive, I imagine."

"Something _magnificent_."

She pauses.

"And the best part is that I can continue my studies without interruption."

She gives you a delighted smile.

"I must admit, your advice was rather good."

**Outcomes:**

- Add story tag `emma_ball_commission_resources`.
- Emma respect +1.
- Emma friendship +1.

### Option C: Suggest a joint research project

**Next:** the_last_dance

**Text:**

"Emma, why not propose something we could work on together? We've already demonstrated that our combined talents can produce rather unusual results."

Emma looks at you thoughtfully.

"That is true."

"And between the two of us, we might be able to undertake something more ambitious without sacrificing quite so much time."

A mischievous smile spreads across her face.

"Fibonacci, are you suggesting that I share the glory?"

"Consider it a generous opportunity to benefit from my brilliance."

"How very charitable of you."

She laughs, then turns toward Lucien.

"Monsieur de Varenne, I wonder whether you might consider a slightly different arrangement."

She explains that the two of you have been experimenting with collaborative artificery, combining complementary techniques to produce unusual magical effects.

Lucien listens attentively.

"A joint project?"

"Precisely. Antonio is an exceptionally capable artificer, and we've discovered that our methods work rather well together."

She glances at you.

"When we manage not to argue over the details."

"An ongoing challenge," you agree.

Lucien smiles.

"Well, I certainly wouldn't object to meeting another promising scholar. Perhaps we could arrange a preliminary demonstration?"

Emma accepts enthusiastically.

When the conversation ends, she turns toward you with a satisfied smile.

"Well, partner. It seems we've acquired ourselves another project."

"You're welcome."

"Oh, don't look so smug. I haven't yet decided whether inviting you to share my research was an act of genius or a catastrophic lapse of judgment."

She slips her arm through yours.

"But I suppose we'll find out together."

**Outcomes:**

- Add story tag `emma_ball_joint_research`.
- Emma friendship +2.
- Emma rivalry +1.

---

## Node: the_last_dance

**Title:** One More Dance  
**Image:** large  
**Emotion:** happy

The conversation with Lucien concluded, you and Emma return to the main ballroom.

The orchestra has begun playing again, and the floor is filling with couples.

Emma seems unusually thoughtful as you walk together. Her evening has certainly turned out rather differently from what she expected.

Then she looks up at you and smiles.

"Well, Antonio. I believe our little expedition has been quite a success."

"You did make an impression."

"Naturally."

She pauses, then laughs softly.

"Although I must confess, I had almost forgotten about Lord de Varenne altogether. I was having rather too good a time."

You glance toward the dancers.

"Well, Delamain. The evening isn't over yet."

She follows your gaze.

"Another dance?"

"Unless you've had enough."

Emma looks at you for a moment, her expression warm and unusually unguarded.

"Not remotely."

She takes your hand.

"Come along, Antonio. I think I've done quite enough professional networking for one evening."

As you lead her back onto the dance floor, she adds with a mischievous smile:

"And besides, I haven't finished showing you off."

The orchestra swells, and the two of you disappear into the graceful whirl of dancers, leaving professional ambitions, influential patrons, and complicated futures to wait until morning.

For now, there is music.

And rather excellent company.

## On enter

- Emma friendship +1.
- Add story tag `emma_ball_shared_evening`.
