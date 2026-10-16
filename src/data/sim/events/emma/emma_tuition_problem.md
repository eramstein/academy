# Event: An Unexpected Debt

**Event ID:** `emma_tuition_problem`  
**Trigger:** `molly_tutoring` story tag; Emma knownTraits ≥ 2; evening
Image: medium

## Text

You encounter Emma in a quiet corridor of the Academy, standing by a window with a letter in her hands. She seems unusually still, her eyes fixed on the page. As you approach, she hastily folds the letter and slips it into her pocket. By the time she turns toward you, her familiar composure has almost returned.

"Antonio. What a pleasant surprise." Her smile is perfectly polite, and almost perfectly convincing.

You ask whether something is wrong.

"Nothing worth troubling you with." She looks away, then lets out a quiet sigh. "Oh, very well. It seems my bank has developed an exciting new interpretation of our agreement. One in which I owe them rather a lot of money, rather sooner than expected."

She attempts a dismissive smile, but it doesn't quite work. "I borrowed the money to pay my tuition. I've been working towards a place here for years, and I thought I had everything arranged." She pauses, looking through the window at the Academy grounds. "If I cannot meet their demand, I may have to leave."

For a moment, she seems very far away. Then she straightens her shoulders.

"Well. I've faced worse difficulties." Her voice regains some of its customary firmness. "I'll find a solution. I always do."

## Effects

- knownTraits: Emma's Academy education is financed through a loan. Her family's circumstances have made her education difficult to afford, and remaining at the Academy is extremely important to her.

## Options

### Option A: Offer to lend her the money

**Text:**

"I have some savings," you say. "Not much, but perhaps enough to help you through this."

Emma looks at you, genuinely startled.

"Antonio, no. Absolutely not."

You insist that you're serious.

"I can see that." Her expression softens. "And I can also see that you're hardly in a position to throw money around. You worked for your place here too, didn't you?"

She hesitates, evidently searching for the right words.

"That's an extraordinarily generous offer. And an extraordinarily foolish one." A faint smile appears. "Please don't make me choose between accepting your kindness and calling you an idiot."

She reaches out and briefly squeezes your arm.

"Thank you. Truly. But this is my problem to solve."

**Outcomes:**

- Emma friendship +2.
- Tag: `emma_offered_loan`.

### Option B: Suggest Molly's tutoring work

**Conditions:** `molly_emma_suggested` is true.

**Text:**

"Actually, I might have a solution. Molly is looking for someone to tutor children from the village. It's paid work, and you'd be perfect for it."

Emma considers this. "Molly? Yes, I know about her little project. But why me?"

"Why you? Emma, you're probably the brightest student in the Academy. You understand things in an afternoon that take the rest of us weeks. You're disciplined, articulate, extraordinarily well-read, and you have this remarkable ability to—"

You stop.

Emma is looking at you with an expression of delighted fascination. One eyebrow rises slowly.

"Please, don't stop on my account. I was particularly enjoying the part about my extraordinary abilities."

"Yes, well. I meant that you're qualified for the position."

"Naturally." Her smile grows. "Please continue. I believe you were about to mention my devastating intellect."

You decide that the less you say, the better.

Fortunately, Emma's attention returns to the opportunity itself. "Actually, it's a wonderful idea. I could arrange the hours around my studies, and Molly would certainly be reasonable about the pay. Why didn't I think of this before?"

She's already halfway down the corridor when she suddenly stops, turns around, and hurries back.

"Antonio."

She takes your hand in both of hers and looks you directly in the eyes. The teasing expression has vanished, replaced by something unusually earnest.

"Thank you. Truly."

For a brief moment, neither of you speaks. Then she releases your hand, gives you a brilliant smile, and rushes off in search of Molly.

You suspect the subject of your little speech has not been forgotten. Not remotely.

**Outcomes:**

- Emma love +1.
- Emma friendship +1.
- Tag: `emma_tutoring_referral`.

### Option C: Offer to examine the loan agreement

**Text:**

"Wait. You said the bank is demanding payment earlier than agreed. Can they actually do that?"

Emma raises an eyebrow. "I had assumed they could. Banks tend to be rather confident about these things."

"Let me see the agreement."

She hesitates, then produces the folded letter and a much thicker bundle of documents from her bag. Of course she has kept everything, meticulously organized.

"Very well. But if you're about to explain financial contracts to me, Fibonacci, you'd better be certain of your facts."

You find an empty study room and spread the papers across a table. What begins as a quick examination becomes an increasingly elaborate investigation. Emma proves to be a formidable partner, dissecting obscure clauses and cross-referencing regulations with merciless precision. You contribute your own observations, and the occasional suggestion that bankers ought to be forbidden from writing sentences longer than the average sermon.

Hours pass. Candles burn low. At some point, the two of you become so absorbed in arguing over the interpretation of a particularly troublesome paragraph that neither notices the library closing.

By the time the first pale light of dawn reaches the windows, you've exhausted a considerable supply of ink, several volumes of commercial law, and most of your ability to form coherent sentences.

**Test:** Intelligence — Hard.

**On success:**

And then, finally, you see it.

"Emma. Look at this."

The bank has invoked a clause permitting early repayment, but Emma's original agreement requires formal notice well in advance. The letter she's received doesn't come close to satisfying that requirement.

Emma leans over your shoulder to examine the passage. She reads it once, then again, very slowly.

"Oh, that's beautiful."

She takes the document from your hands, checks the relevant references, and suddenly laughs.

"They can't do it! Not yet, at least. They have to honor the original schedule!" She looks at you with unconcealed delight. "Antonio, you magnificent creature!"

You lean back in your chair, feeling rather pleased with yourself.

"I must say, Emma, I never imagined you'd invent such elaborate excuses to spend an entire night with me. I only hope next time we can find something more romantic than financial law."

She looks at you over the documents, one eyebrow raised.

"Careful, Fibonacci. I might take that as an invitation."

"Would that be so terrible?"

"Not at all. Next time, I'll bring the municipal tax code."

She smiles sweetly, then returns to her papers, leaving you to contemplate the dangers of flirting with a woman who always insists on having the last word.

**Outcomes on success:**

- Emma respect +2.
- Emma friendship +1.
- Emma rivalry +1.
- Tag: `emma_contract_saved`.

**On failure:**

Despite your best efforts, the relevant clauses prove stubbornly unhelpful. Emma finds several promising passages, but each is defeated by another, invariably written in language that seems designed to discourage the human race from reading.

By dawn, the table is buried under documents, your eyes are aching, and the bank remains legally triumphant.

Emma closes the last book with a weary sigh.

"Well. I suppose we have established that the bank employs exceptionally competent lawyers."

"Perhaps we should have studied law instead of magic."

"Don't be ridiculous. Magic is considerably more honest."

She smiles, then looks at the mountain of papers between you.

"Thank you, Antonio. You didn't have to spend your entire night on this."

"Well, next time you invite me to spend the night with you, I hope you'll have something more entertaining planned."

Emma gives you a tired but genuine laugh.

"I'll see what I can arrange. Perhaps a detailed examination of property taxation."

At least her sense of humor has survived the ordeal.

**Outcomes on failure:**

- Emma friendship +1.
- Tag: `emma_contract_attempted`.
