# Event: A Tactical Diversion

**NPC:** emma  
**Event ID:** `emma_diversion_kiss`  
**Trigger:** evening; Emma love ≥ 6  
**Image:** `emma_diversion_kiss.jpg` large  
**Emotion:** flirtatious

## Text

The market square is busy with its usual collection of merchants, shoppers, and people who appear to have nothing better to do than obstruct the passage of everyone else.

You're passing a bookstall when you spot Emma emerging from the crowd. Two young gentlemen in expensive, rather ostentatious clothes are following close behind her.

"Come now, my dear, surely you can spare us an afternoon!"

"I assure you, gentlemen, I cannot."

"Just one drink! You needn't be so difficult!"

Emma turns toward them, her smile becoming distinctly less friendly.

"For the third time, no. Good day."

She walks away. They follow.

Then she spots you.

Her expression changes instantly.

"Antonio!"

Before you can reply, she's striding toward you with a brilliant smile.

"Perfect timing," she whispers. "Play along."

She takes your hands, draws you close, and kisses you.

For a moment, you forget entirely about the market, the bookstall, and the existence of the human race.

You become vaguely aware of two disappointed voices nearby.

"Oh. Well, she might have mentioned..."

"Come on, let's go."

Their footsteps retreat.

Emma doesn't seem to notice.

Then, at last, she draws back.

She looks into your eyes for a brief moment before releasing your hands and turning to check that her admirers have disappeared.

"Excellent," she announces, recovering her usual composure. "That worked rather well."

You stare at her.

"Oh, don't look so scandalized, Antonio. It was a tactical diversion. Simple, elegant, and remarkably effective."

A small, mischievous smile appears.

"Besides, I knew I could count on your cooperation."

## Options

### Option A: At your service, my lady

**Next:** a_lucky_day

**Text:**

You give her an extravagant bow.

"My lady, it is my sacred duty as your humble knight to defend you from unwanted suitors. Should you ever require such assistance again, you have only to call."

Emma laughs.

"How very gallant of you, Sir Antonio."

"And I must compliment you on your performance. Such dedication to your role!"

Emma blushes.

"You know me. I always do my best."

**Outcomes:**

- Emma friendship +1.

### Option B: Question her strategy

**Next:** a_lucky_day

**Text:**

"Delamain, I entirely understand the strategic necessity of the kiss. A brilliant diversion, really."

Emma smiles with evident satisfaction.

"Naturally."

"Although there's one detail I find rather difficult to explain."

"Oh?"

"Wasn't the tongue a little excessive?"

Emma blushes, visibly amused, and suddenly finds something very interesting to look at on the other side of the square.

**Outcomes:**

- Emma rivalry +1.

---

## Node: a_lucky_day

**Title:** Fortune Favors the Bold  
**Emotion:** amused

Emma suddenly remembers something.

"Oh! Before I forget."

She opens her satchel and retrieves a small leather card case.

"I collected these from the artificery workshop this morning. Some experimental designs I've been working on. I was planning to show you later."

She opens the case, revealing three beautifully crafted cards.

"Here. Choose one. I'd like you to have it."

Then a thoroughly wicked smile spreads across her face.

"Antonio, I do hope you appreciate just how extraordinarily fortunate you are today."

She holds up one finger.

"First, the prettiest girl in town gives you a kiss."

A second finger.

"And then she presents you with a magnificent gift."

She sighs theatrically.

"Really, Fibonacci. I fear the rest of your life will be something of a disappointment by comparison."

**On enter:**

- Gift Antonio a choice of one of three cards, pools "emma" and "base"
- Add story tag `emma_first_kiss`.
