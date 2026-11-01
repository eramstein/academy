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
- Add chat topic `emma_memory_falkenheim_receipt` (memory; only Emma knows it): "Three signatures," Emma says, with the air of someone recounting a natural disaster. "The administrator counted out your thousand coins and then produced a receipt that required a small committee." You ask whether he was protecting the treasury. "I think he was protecting the receipt. The coins seemed perfectly willing to leave." She shakes her head. "Next time we ask whether the prize includes paperwork. I should like to budget for it."

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
- Add chat topic `emma_memory_falkenheim_discount` (memory; only Emma knows it): "Forty-seven conditions," Emma says. "I have been trying to decide which of them offended me most." You remind her that twenty percent off crafting materials is not nothing. "No. It is merely something my banker cannot deposit." She gives you a look of profound, fond sympathy. "I do hope one of them permits you to buy a gemstone without founding a subcommittee."

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
- Add chat topic `emma_memory_falkenheim_reward` (memory; only Emma knows it): "I caught myself doing something quite extraordinary yesterday," Emma says. "Looking at a purchase without first calculating which meal I'd have to skip to afford it." You ask whether the Falkenheim prize has changed her habits. "Not yet. I'm not reckless." A smile breaks through. "But I might permit myself the occasional luxury. A book, perhaps. One that isn't strictly necessary."
- Add chat topic `emma_memory_falkenheim_cash` (memory; only Emma knows it): "I have been reviewing my performance in the administrator's office," Emma says. "He began to explain the alternatives, and I answered with a single word." You suggest that the word was cash. "Twice. I believe in thoroughness." She looks entirely unrepentant. "He stopped explaining. I consider the method a success."
- Add chat topic `emma_memory_falkenheim_student` (memory; only Emma knows it): "The bank clerk asked me to repeat myself," Emma says. "Apparently 'I would like to repay the loan' is not a sentence he hears from students." She gives a small, wondering laugh. "The letters, the interest, all those careful calculations... one purse, and they were finished." She looks at you. "I can actually afford to be a student, Fibonacci. Do try not to let it go to my head."
- Add chat topic `emma_memory_falkenheim_land` (memory; only Emma knows it): Emma produces the commemorative Academy card and turns it in the light. "I still can't quite believe they gave us these. A land enchantment we won't be taught for years, and they handed it over as if it were a certificate." She studies the spires. "I keep it with me. Not to play. Not yet. I should hate to discover I've been carrying a masterpiece and using it to pay for a workshop."
- Add chat topic `academy_lore_falkenheim_prize` (lore; public; once only; Emma excluded): "The administration has been insufferable since Falkenheim," your companion says. "They paid Delamain and Fibonacci out of the Academy treasury rather than wait for the prize to clear. A thousand coins, or a discount at the materials shop, and a commemorative land card of the Academy itself." There is a short laugh. "I have never heard the Board of Governors described as pleased. I assumed the word was reserved for endowments."
