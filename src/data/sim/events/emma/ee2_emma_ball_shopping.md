# Event: A Question of Elegance

**NPC:** emma  
**Event ID:** `emma_ball_shopping`  
**Trigger:** Scheduled activity `emma_ball_shopping`  
**Image:** large

## Text

The shop Emma has chosen stands on one of the more fashionable streets of the town, its windows displaying embroidered waistcoats, elegant coats, and garments whose prices appear to have been calculated by someone with a personal grudge against students.

Emma is waiting outside, looking entirely at ease.

"Antonio! Right on time. Come along, we have work to do."

Inside, a dignified tailor greets you with a polite bow. His enthusiasm increases noticeably when Emma begins examining his finest merchandise.

"Something suitable for the Academy ball," she explains. "Elegant, distinguished, but not excessively ostentatious. We want to make a good impression, not declare war on the aristocracy."

The tailor nods gravely and disappears among the shelves.

What follows is a rather exhausting series of fittings.

The first coat makes you look, according to Emma, "like a provincial tax collector attending his own funeral." The second is apparently designed for a man of considerably greater girth. A third features so much embroidery that Emma takes one look at you and bursts into laughter.

"Oh, Antonio. You look like a prince!"

"Excellent."

"A prince who has misplaced both his kingdom and his judgment. Take it off."

Eventually, after considerable discussion, the tailor produces three outfits that meet Emma's exacting standards.

The first is a handsome, understated ensemble in dark wool, well cut and entirely respectable. The second is considerably finer, with rich fabrics, careful embroidery, and the unmistakable appearance of a gentleman accustomed to good company. The third is a particularly striking creation of deep blue velvet and silver detailing, elegant enough to attract attention without quite becoming ridiculous.

Emma studies all three with the concentration of someone evaluating competing designs for an exceptionally important enchantment.

"Well, Fibonacci. They all have their merits. The first is perfectly respectable, the second is rather distinguished, and the third..."

She considers the elaborate blue coat.

"The third would certainly make an impression."

Then she turns toward you with a mischievous smile.

"So. How much of your fortune are you prepared to sacrifice upon the altar of elegance?"

## Options

### Option A: A respectable gentleman — 50

**Next:** a_finishing_touch

**Transaction:** Spend 50 gold.

**Text:**

You settle on the modest dark wool ensemble. The tailor makes a few adjustments, and you examine yourself in the mirror with considerable satisfaction.

"Perfectly respectable," Emma declares, walking slowly around you. "A sensible choice. Understated, practical, and quite flattering."

"High praise indeed."

"Don't become accustomed to it."

She straightens your collar and steps back.

"There. You look like a young gentleman with excellent prospects and the good sense not to spend them all on clothing."

"Almost as though I belong among the aristocracy."

"Oh, let's not be ambitious, Antonio. We can manage _well-dressed_. Aristocratic manners may take a little longer."

She smiles, clearly pleased with the result.

**Outcomes:**

- Spend 50 gold.
- Add possession to Antonio:
  - **Type:** clothing
  - **Name:** Respectable Evening Attire
  - **Description:** A well-tailored ensemble of dark wool, with a crisp linen shirt and a modest embroidered waistcoat. Understated, practical, and entirely suitable for respectable company.
- Add story tag `emma_ball_outfit_respectable`.
- Emma friendship +1.

### Option B: Dress to impress — 100

**Next:** a_finishing_touch

**Transaction:** Spend 100 gold.

**Text:**

You choose the distinguished ensemble. The tailor helps you into the fine coat, adjusts its embroidered cuffs, and presents you before the mirror.

Emma studies you with evident approval.

"Now _that_ is considerably better."

She approaches, brushes an imaginary speck of dust from your shoulder, and adjusts the fold of your cravat.

"Stand straight, Antonio."

You oblige.

"Chin up. Shoulders back."

"Anything else, Your Majesty?"

"Yes. Try not to speak until I've finished admiring my work."

She takes a step back, tilts her head, and smiles.

"Actually... yes. That suits you rather well."

For a moment, she seems genuinely impressed. Then her familiar composure returns.

"Remarkable what proper tailoring can accomplish."

You decide to accept the compliment before she has time to qualify it further.

**Outcomes:**

- Spend 100 gold.
- Add possession to Antonio:
  - **Type:** clothing
  - **Name:** Distinguished Evening Suit
  - **Description:** An elegant formal ensemble of fine charcoal wool, with tasteful embroidery, polished buttons, and a beautifully tailored waistcoat. The attire of a confident young gentleman who knows how to present himself in distinguished company.
- Add story tag `emma_ball_outfit_distinguished`.
- Emma friendship +1.
- Emma respect +1.

### Option C: Spare no expense — 200

**Next:** a_finishing_touch

**Transaction:** Spend 200 gold.

**Text:**

You point toward the elaborate blue velvet ensemble.

"That one."

Emma's eyebrows rise.

"Antonio. Are you quite certain?"

"Absolutely. You said we ought to make an impression."

"I did. I wasn't necessarily suggesting we attempt to outshine the entire nobility."

Nevertheless, she looks delighted as the tailor helps you into the magnificent coat.

The fabric is extraordinarily fine, the silver embroidery delicate and intricate. When the tailor finishes, Emma falls silent.

She looks you up and down, her expression unusually difficult to read.

"Well?" you ask.

"One moment."

She circles you slowly, examining the cut of the shoulders, the fall of the fabric, the silver clasp at your throat.

Then she smiles.

"Oh, Antonio. That is _splendid_."

"Really?"

"Quite. In fact, I'm beginning to worry that I've created a rival for the attention of every lady at the ball."

"Should I be concerned?"

"Not at all. I shall simply inform them that you're terribly dull and have no prospects whatsoever."

She gives you a brilliant smile.

"Come along, Your Highness. Before I change my mind and insist on something less magnificent."

**Outcomes:**

- Spend 200 gold.
- Add possession to Antonio:
  - **Type:** clothing
  - **Name:** Magnificent Blue Velvet Attire
  - **Description:** A sumptuous formal ensemble of deep blue velvet, richly decorated with exquisite silver embroidery and a matching waistcoat. Striking, elegant, and unmistakably expensive. A garment designed to draw admiring glances in the grandest of ballrooms.
- Add story tag `emma_ball_outfit_magnificent`.
- Emma rivalry +1.
- Emma friendship +1.

---

## Node: a_finishing_touch

**Title:** A Finishing Touch  
**Emotion:** happy

With your new clothes carefully wrapped, you prepare to leave the shop. Emma, however, suddenly remembers something.

"Oh! One moment, Antonio. I nearly forgot."

She turns back toward the tailor and exchanges a few quiet words with him. You wait near the door while he retrieves a small box from behind the counter.

A little later, Emma emerges looking suspiciously pleased with herself.

"Here."

She presses the box into your hands.

Inside is a beautifully crafted silver cravat pin, its head decorated with a small, deep blue gemstone.

"Emma, what's this?"

"A finishing touch, obviously. You can hardly attend the Academy ball with an improperly secured cravat."

"You bought this for me?"

"Well, I certainly didn't buy it for myself. I have no intention of wearing a cravat."

You examine the little pin. It's an elegant piece, and judging by the craftsmanship, not an inexpensive one.

"Emma, you really didn't have to."

"I know."

Her answer is unusually simple. She watches you for a moment, then gives a small smile.

"Consider it a thank-you for agreeing to accompany me. And for putting up with an entire afternoon of my excellent advice."

She pauses.

"Besides, I thought the blue would suit you."

For a moment, the usual teasing is absent from her expression.

Then she recovers.

"Now, do put it away before you lose it. I'd hate to discover that my investment in your appearance was entirely wasted."

### Option A: Thank her

**Text:**

"Thank you, Emma. It's a beautiful gift."

Her expression softens.

"You're very welcome, Antonio."

She takes your arm as you leave the shop, looking rather pleased with the afternoon's accomplishments.

"Well. One problem solved. Now all we need is for you to remember which foot goes where on the dance floor."

"You're not worried?"

"Not particularly. I happen to be an excellent dancer."

You suspect Saturday evening is going to be quite an experience.

**Outcomes:**

- Emma friendship +1.
- Add possession to Antonio:
  - **Type:** clothing
  - **Name:** Emma's Silver Cravat Pin
  - **Description:** An elegant silver cravat pin set with a small deep blue gemstone, given to Antonio by Emma during their preparations for the Academy ball. A thoughtful gift from a friend with impeccable taste.
- Add story tag `emma_ball_gift`.

### Option B: Tease her about the gift

**Text:**

"A present, Delamain? Why, I'm touched. One might almost think you're fond of me."

Emma gives you a patient look.

"Don't be absurd, Fibonacci. I simply refuse to be seen in public with a gentleman whose accessories offend my sense of aesthetics."

"So it's purely a matter of professional necessity?"

"Entirely."

You turn the little pin over in your hand.

"A very generous professional necessity."

She raises an eyebrow.

"Would you prefer I take it back?"

"Absolutely not."

"Then I suggest you stop interrogating your benefactor."

She slips her arm through yours and leads you toward the door.

"Come along. We have a ball to attend, and I have a reputation to maintain."

**Outcomes:**

- Emma rivalry +1.
- Emma friendship +1.
- Add possession to Antonio:
  - **Type:** clothing
  - **Name:** Emma's Silver Cravat Pin
  - **Description:** An elegant silver cravat pin set with a small deep blue gemstone, given to Antonio by Emma during their preparations for the Academy ball. A thoughtful gift from a friend with impeccable taste.
- Add story tag `emma_ball_gift`.
