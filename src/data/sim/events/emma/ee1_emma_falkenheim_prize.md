# Event: The Spoils of Victory

**Event ID:** `emma_falkenheim_prize`  
**NPC:** emma  
**Trigger:** morning and story tag emma_tournament_win  
**Location:** Academy administration office  
**Emotion:** happy  
**Image:** `emma_falkenheim_prize.jpg` large

## Text

Being summoned to the administrator's office first thing in the morning is rarely a cause for celebration. You and Emma arrive with matching expressions of suspicion, although Emma has at least made an effort to look respectable.

The administrator, however, seems positively delighted.

"Ah! Our champions! Come in, come in!" He gestures toward the chairs opposite his desk. "I have some excellent news. The Academy's reputation has benefited enormously from your little expedition to Falkenheim. The Board of Governors is most pleased."

Emma exchanges a glance with you. You've never heard the words _Board of Governors_ and _pleased_ in the same sentence before.

"Ordinarily, your tournament prize would take several weeks to process. However, in recognition of the prestige you've brought us, the Academy has decided to advance the reward from its own treasury."

He produces two official-looking documents.

"Each of you may choose between a payment of one thousand coins, or a twenty-percent discount on all purchases at the Academy's materials shop for the next year."

"One thousand coins?" Emma repeats.

"Indeed."

"In actual money?"

The administrator looks mildly offended. "We do occasionally conduct our affairs in actual money, Miss Delamain."

"Cash," she says immediately.

"Perhaps you'd like to consider—"

"Cash."

"Very well, then."

He makes a note, carefully avoiding your eyes.

"And there is one more thing."

From a drawer, he produces two cards and places them on the desk.

You recognize the imposing towers, elegant courtyards, and familiar spires of your own Academy. Beautifully rendered, the illustration seems almost alive with magical energy.

"A commemorative Academy land card, for each of you. Commissioned especially for our victorious representatives."

Emma picks hers up with almost reverent care.

"A land card?" She examines it from several angles. "But these are advanced enchantments! We won't even begin studying their construction until our later years."

"Quite so. Consider it an investment in the Academy's future champions."

Emma is too busy admiring her card to notice the administrator looking rather pleased with that last remark.

"And you, Mr. Fibonacci? Which reward would you prefer?"

## Effects

- Gift Antonio the_academy card
- Gift Emma the_academy card
- Emma receives 1000 gold
- Add story tag `emma_loan_repaid`.
- Record in Emma's known traits: **Financial independence:** Her tournament prize has allowed her to repay her tuition loan, removing the immediate threat to her education.

## Options

### Option A: Take the 1,000 coins

**Text:**

"I'll take the money, thank you."

"A sound decision," Emma says with obvious approval.

The administrator counts out your reward and presents you with a receipt requiring only three signatures.

You sign the first.

Then the second.

By the third, you begin to understand why the Academy employs so many administrators.

**Outcomes:**

- Antonio receives 1,000 coins.

{{afterPrize}}

### Option B: Take the materials discount

**Text:**

"I'll take the discount at the materials shop."

Emma raises an eyebrow.

"An interesting choice, Fibonacci."

"Think how much we spend on crafting materials."

"Oh, I've thought about it. Extensively." She glances at her own reward. "But I rather suspect my banker would be less enthusiastic about accepting discounted gemstones in lieu of payment."

The administrator hands you a stamped certificate.

"Twenty percent off, valid for one year. Non-transferable, non-refundable, and subject to the usual conditions."

"How many conditions?"

"Only forty-seven."

Emma looks at you with profound sympathy.

**Outcomes:**

- Unlock a 20% discount on purchases at the Academy's materials shop for one year.

{{afterPrize}}

## Conditional passages

### afterPrize

**Always:**

Outside the office, Emma stops in the corridor and looks down at the purse in her hand.

Then she laughs.

Not her usual little sarcastic laugh, either. A genuine, delighted laugh that makes a passing student turn to stare.

"Antonio. I'm going to pay it off."

"Your loan?"

"Every last coin. The bank, the interest, those dreadful letters..." She gives the purse a little shake. "All of it. Gone!"

She looks almost dizzy with relief.

"I've spent months calculating how much I owe, how much I can earn, how long I can possibly stay here. And now..."

For a moment, she seems unable to finish the sentence.

Then she looks up at you, grinning.

"I can actually afford to be a student!"

"An alarming prospect. You might have time to enjoy yourself."

"Don't be ridiculous, Fibonacci. I have far too much work to—"

She stops.

A thoughtful expression crosses her face.

"Well. Perhaps a _little_ time."

{{tutoringThanks}}

**When:** `emma_tutoring_referral`

"And you know, with the money I'm earning from Molly's tutoring project, I might even be able to afford a few luxuries now and then."

She says the word _luxuries_ with the cautious fascination of someone discussing a rare and potentially dangerous magical substance.

Then her expression softens.

"Speaking of which, Antonio..."

She reaches over and gives your arm a brief, affectionate squeeze.

"Thank you. For suggesting me to Molly, I mean. I don't think I ever properly thanked you for that."

"You did, actually."

"Well, I'm doing it again. Try to endure the experience."

Her smile widens.

"Come on. I'm buying you a coffee at the cafeteria."

"You're buying?"

"Yes, Fibonacci. With my own money. A truly historic occasion."

She starts down the corridor, then looks back.

"And don't get carried away. One coffee. I'm not made of money."

**Otherwise:**

She slips the purse safely into her bag, still smiling to herself.

"Well, I ought to visit the bank before my next class."

"Already?"

"Antonio, I've been dreaming of that moment for months. I'm not waiting another day."

She takes a few steps, then turns back.

"And we should celebrate properly sometime. Preferably somewhere that doesn't charge extra for a clean table."

She gives you a bright smile.

"See you later, Fibonacci!"

**Final effects:**

- Emma friendship +1.
- Add story tag `emma_falkenheim_prize_received`.
