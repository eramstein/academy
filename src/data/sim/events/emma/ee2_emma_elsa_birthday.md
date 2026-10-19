# Event: The Price of High Society

**NPC:** elsa  
**Event ID:** `emma_elsa_birthday`  
**Trigger:** Evening; Emma is present; `emma_trusted_companion` story tag  
**Emotion:** neutral

## Text

You and Emma are leaving the Academy when a familiar voice calls after you.

"Emma! Antonio! Just the two people I was hoping to find."

Elsa Falkenstein approaches, looking particularly pleased with herself. She carries an elegant envelope, sealed with crimson wax.

"I'm hosting my birthday celebration at the Royal Pigeon Inn next Saturday. A proper reception, naturally. Music, dancing, an excellent dinner, and a rather distinguished guest list."

She hands Emma the envelope.

"I would very much like you to attend, Emma. Your little successes at the Academy have attracted quite a bit of attention lately. I think you'll find the company interesting, and I'm sure my guests will be delighted to meet you."

Emma studies the invitation, mildly surprised.

"How very gracious of you, Elsa."

"Naturally. And Antonio, I have a rather different role in mind for you."

Elsa's smile widens.

"I'm going to need an additional waiter."

There is a short silence.

"A waiter?" you repeat.

"Yes, darling. You do have experience in hospitality, don't you? And I've already arranged a proper uniform for you. White gloves, a splendid black coat, the works. You'll look positively magnificent."

Emma presses her lips together. You recognize the expression. She is making a considerable effort not to smile.

{{ invitation_terms }}

## Conditional passages

### invitation_terms

**When:** Story tag `elsa_favor_owed` is present

"Now, before you object," Elsa continues, "I believe we had an agreement. A certain little favor, in exchange for some rather valuable information about my brother."

Ah.

You remember that agreement. You remember expressing certain reservations about it, too.

Emma inclines her head.

"Quite right, Elsa. A promise is a promise."

"How refreshing! I knew I could count on you both."

Elsa looks positively radiant.

"And don't worry, Antonio. I assure you the uniform is of the very finest quality."

**Otherwise:**

"Of course, I wouldn't dream of imposing on you without compensation," Elsa adds pleasantly. "Two hundred crowns each. For one evening. I think you'll agree that's a generous offer."

Emma raises an eyebrow.

"Two hundred each? That's rather extravagant for a birthday party."

"My dear Emma, I intend this to be an occasion people remember. Good company is worth paying for."

She turns toward you.

"Well, Antonio? What do you say?"

## Options

### Option A: Honor the agreement

**Only if:** Story tag `elsa_favor_owed` is present

**Next:** birthday_party

**Text:**

"Well, a deal is a deal," you concede.

"Precisely!" Elsa claps her hands, delighted.

You turn toward Emma.

"Remind me, whose brilliant idea was it to owe Elsa a favor?"

Emma regards you with complete composure.

"I believe we agreed it was an excellent strategic decision at the time."

"Did we?"

"We obtained the information, didn't we?"

Elsa watches the exchange with evident satisfaction.

"Oh, this is going to be such a lovely evening."

### Option B: Accept the offer

**Only if:** Story tag `elsa_favor_owed` is absent

**Next:** birthday_party

**Text:**

"Two hundred crowns for an evening's work? Very well. You have yourself a waiter."

"Splendid!" Elsa beams. "I knew you'd be reasonable."

Emma looks at you with amused disbelief.

"Antonio Fibonacci, bought for two hundred crowns. I shall remember this."

"Coming from someone who just accepted two hundred crowns for attending a party, that's rather rich."

"Ah, but I'm attending as a guest. You're serving drinks."

Elsa looks from one to the other, clearly enjoying herself.

"Wonderful. Now, about your measurements..."

**Outcomes:**

- Give Antonio 200 coins.

### Option C: Politely decline

**Only if:** Story tag `elsa_favor_owed` is absent

**Text:**

"Thank you, Elsa, but I think I'll decline. Two hundred crowns is tempting, but I didn't come to the Academy to spend my evenings serving drinks."

Elsa looks briefly disappointed.

"Oh, what a pity. I was so looking forward to seeing you in the uniform."

"I'm sure you were."

Emma gives you an approving glance.

"A perfectly reasonable decision, Antonio. Though I confess, I'm a little disappointed myself."

"About the money?"

"About the uniform, naturally."

Elsa sighs.

"Well, I'll simply have to find someone else. Emma, darling, I do hope you'll still come."

Emma considers the invitation.

"Why not? It sounds like an interesting evening."

Elsa brightens at once, and the two young women begin discussing the guest list, leaving you with the uncomfortable realization that your refusal has deprived you of precisely one thing: an opportunity for Emma to laugh at your expense.

**Outcomes:**

- Emma respect +1.

---

## Node: birthday_party

**Title:** A Most Distinguished Waiter  
**Image:** `emma_elsa_birthday_party.jpg` large  
**Emotion:** laughing

The Royal Pigeon Inn has been transformed for the occasion. Chandeliers glitter above elegantly dressed guests, a small orchestra plays near the windows, and liveried servants glide between the tables bearing silver trays of delicacies.

Elsa has spared no expense. To her credit, the result is magnificent.

You, meanwhile, are standing in a servants' room, contemplating your reflection in a mirror.

The uniform is magnificent too, in its own way. A stiff black tailcoat, a brilliant white waistcoat, an enormous bow tie, immaculate white gloves, and a collar so high that turning your head has become a complicated operation.

You look like a penguin that has inherited a title.

The head waiter inspects you, adjusts your bow tie by a fraction of an inch, and hands you a silver tray.

"Sparkling wine. The ladies at the table by the window."

You take the tray and make your way through the reception.

There, seated together in elegant evening dresses, are Emma and Molly. The two friends are enjoying themselves enormously, laughing over some private conversation.

Emma notices you first.

Her expression freezes.

Her eyes travel slowly from your polished shoes to the tails of your coat, then upward to the magnificent bow tie.

She presses a hand to her mouth.

Molly turns to see what has caught her attention.

"Oh! Antonio! You look so..."

Molly stops, searching desperately for a suitable adjective.

"...professional!"

That does it.

Emma lets out a small, strangled sound. She attempts to disguise it as a cough, then as a sip from her glass, but the effort is hopeless. Her shoulders begin to shake.

"Emma," you say with as much dignity as your collar permits, "may I offer you some sparkling wine?"

She tries to answer. She truly does.

"Thank you, Antonio, that's very..."

Her eyes meet yours.

"...very..."

And then she loses the battle entirely.

She bursts into helpless laughter, bending forward with one hand over her face. Molly, caught between sympathy for you and the contagious absurdity of the situation, begins giggling too.

For perhaps half a minute, Emma is quite incapable of speech.

At last, she manages to recover enough composure to accept a glass.

"Oh, Antonio!" She wipes a tear from the corner of her eye. "Forgive me. It's just... that bow tie! And the way you're standing!"

"Madam," you reply stiffly, "I am merely endeavoring to provide the highest standard of service."

This proves to be a serious mistake.

Emma collapses into laughter again.

Molly reaches across the table to pat your hand sympathetically.

"I think you look very handsome, Antonio. Really!"

"Thank you, Molly."

Emma raises her glass, still struggling to contain herself.

"To Antonio Fibonacci," she declares, "the most distinguished gentleman ever to carry a tray!"

You give an elaborate bow, to the evident delight of both ladies, and retreat with what remains of your dignity.

Across the room, Elsa watches the scene with a satisfied little smile. Her party is going splendidly.

And judging by the laughter still coming from the table by the window, it is certainly going to be remembered.

**Outcomes:**

- Emma friendship +1.
