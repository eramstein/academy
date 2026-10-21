# Event: An Evening's Entertainment

**NPC:** emma  
**Event ID:** `emma_violin_evening`  
**Trigger:** Emma is present at the Old Monk Inn, evening; day at least 3  
**Image:** `emma_violin_evening.jpg` large  
**Emotion:** amused

## Text

The Old Monk Inn is unusually lively tonight. Its common room is crowded with merchants, travelers, and townsfolk enjoying their supper. Above the cheerful clatter of glasses and conversation, a violin is playing.

And playing beautifully.

You follow the music toward the far end of the room, where a young woman stands beside the fireplace, her bow moving effortlessly across the strings. The melody is lively and intricate, drawing delighted smiles from the guests.

Emma Delamain.

Of course. Is there _anything_ this woman cannot do?

She finishes with a magnificent flourish, and the room bursts into applause. Several coins find their way into a little wooden bowl beside her chair.

Emma accepts the appreciation with a graceful bow. Then she spots you.

"Antonio! What a pleasant surprise." Her eyes brighten with an idea. "Tell me, do you have any plans for the evening?"

Before you can answer, she gestures toward the crowded room.

"The innkeeper lets me perform here occasionally. The pay isn't magnificent, but the tips are respectable, and apparently the guests prefer my violin to his nephew's bagpipes."

She glances at the growing crowd.

"Unfortunately, I seem to have become rather popular tonight. Would you care to make yourself useful? I could do with someone to collect requests, carry drinks, and ensure my admirers remember where to leave their coins."

She offers you an innocent smile.

"Consider it an opportunity to participate in the arts."

## Effects

- Add to Emma's known traits:
  - **Music and livelihood:** Emma is a virtuoso violinist, the result of years of dedicated practice. She occasionally performs at the Old Monk Inn to earn money for her living expenses. Unlike most Academy students, she cannot rely on family wealth and must work alongside her studies.

## Options

### Option A: Join the performance

**Next:** after_performance

**Text:**

"Very well. I've worked in an inn before. How difficult can it be?"

"Splendid! I knew I could rely on your extensive professional qualifications."

She presses a serving tray into your hands.

"Now, the gentleman in the green coat has requested something cheerful, the merchant by the window insists on a traditional ballad, and the table near the stairs has ordered another round of wine."

She pauses.

"Oh, and Antonio? Do try not to accept any requests for bagpipes."

**Outcomes:**

- No additional game-state effects.

### Option B: Enjoy the concert

**Text:**

"I think I'll leave the professional entertainment to you. Someone has to appreciate it from the audience."

"A wise decision. I should hate to discover that you have hidden musical talents as well. My professional reputation might never recover."

You find a seat and enjoy the performance over a mug of ale. Emma plays magnificently, moving from lively dances to tender ballads, occasionally catching your eye with a small, conspiratorial smile.

When the applause finally dies away, she gives you a theatrical bow.

"Thank you for your patronage, Signor Fibonacci. Your contribution to the arts has been invaluable."

**Outcomes:**

- Emma friendship +1.

---

## Node: after_performance

**Title:** A Profitable Evening  
**Emotion:** happy

The evening proves unexpectedly entertaining. You carry drinks, collect musical requests, and persuade a particularly enthusiastic merchant that standing directly in front of the violinist to declare his admiration is not strictly necessary.

Meanwhile, Emma performs with astonishing skill. She moves effortlessly between solemn melodies and lively dances, captivating the entire room. Even the innkeeper abandons his accounts to listen.

At one point, a rather tipsy gentleman insists that he knows a traditional dance from his homeland. Emma obligingly begins playing, and you watch him demonstrate something resembling a goose attempting to escape a sack.

Emma manages to finish the tune without laughing.

Barely.

By the time the last guests depart, the wooden bowl is overflowing with coins. Emma sits beside you at an empty table and begins counting, arranging the money into neat little stacks.

"Well! That was considerably more profitable than expected."

She separates a generous portion of the earnings, then retrieves a card from the little case beside her violin.

"Now, Antonio, you've earned your share. One hundred gold, if you'd prefer something practical."

She places the card next to the coins.

"Or this. A spare creation of mine. Rather a clever little enchantment, if I say so myself."

She smiles.

"And I generally do."

## Options

### Option A: Take the gold

**Text:**

"I'll take the money, thank you. I've acquired a rather expensive habit of attending the Academy."

"An appalling habit. I suffer from precisely the same affliction."

Emma pushes the coins toward you.

"One hundred gold, as promised. You've earned every piece."

She gathers the remaining coins into her purse, looking thoroughly satisfied.

"An excellent evening's work, Fibonacci. Perhaps we should go into business together."

**Outcomes:**

- Gain 100 gold.
- Emma friendship +1.
- Add story tag `emma_violin_helped`.

### Option B: Accept the card

**Text:**

"I'll take the card. Money comes and goes, but a good enchantment is worth keeping."

Emma looks pleased.

"An intelligent choice. Although I should point out that money has the considerable advantage of being accepted by bakers."

She hands you the card, watching with quiet satisfaction as you examine her work.

"I made that one last term. It served me rather well, but I've since improved upon the design."

"You're giving me your discarded experiments?"

"My _surplus masterpieces_, Antonio. There's a difference."

She smiles.

"Do take good care of it."

**Outcomes:**

- Gift Antonio 1 card (pools emma and base)
- Emma friendship +1.
- Add story tag `emma_violin_helped`.
