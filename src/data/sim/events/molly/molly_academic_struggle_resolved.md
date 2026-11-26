# Event: A Passing Grade

**Event ID:** `molly_academic_struggle_resolved`  
**Invitation:** Molly comes looking for you, positively bursting with good news.  
**Trigger:** Evening, `molly_plot_academic_struggle` ≥ 4.

## Text

"Antonio! There you are!"

Molly comes hurrying toward you, waving a sheet of paper with such enthusiasm that you briefly wonder whether she's won the lottery.

"I passed!"

She thrusts the paper under your nose. It's an examination report, covered in the usual scholarly annotations and a rather unremarkable collection of marks. Nothing that would trouble Emma's position at the top of the class, certainly. But there, unmistakably, is the word _Pass_.

"Not by much," Molly admits, laughing. "But I passed! I was so nervous I could barely hold my pen, and I was sure I'd failed again. I must have checked the results five times."

Her smile softens.

"You've helped me so much, Antonio. I know I still have a lot to learn, but at least now I feel like I might actually belong here."

Then she brightens again.

"And I want to thank you properly! Will you let me treat you to dinner at the Royal Pigeon tonight? My expense, absolutely no arguments!"

## Effects

- Mark Molly's academic struggle plot as resolved (set story tag `molly_plot_academic_struggle_resolved`).
- Add known trait for Molly: `molly_academic_confidence` — Molly has passed her examinations and is beginning to believe she belongs at the Academy.

## Options

### Option A: Thank her, but decline the invitation

**Text:**

You thank Molly warmly, but tell her she really doesn't owe you anything. Seeing her succeed is reward enough.

"Oh, Antonio..." She looks genuinely touched. "That's very sweet of you."

She hesitates, then rummages through her satchel.

"Well, I'm not letting you get away without _something_. Here, pick one! I've been making these, and I'm rather proud of them."

She produces a small collection of playing cards, looking delighted at the prospect of giving you one.

"And don't think this means you've escaped dinner forever," she adds with a mischievous smile. "I'll find another excuse."

**Outcomes:**

- Molly respect +1.
- Offer Antonio a choice of one card from three randomly selected cards in the `molly,base` collection.

### Option B: Accept Molly's invitation

**Text:**

"Of course. I'd be delighted."

Molly clasps her hands together.

"Wonderful! I've already made arrangements. Well, I was _hoping_ you'd say yes, so I made arrangements. Which is almost the same thing."

She takes your arm and leads you toward town with a spring in her step.

**Outcomes:**

- Move Antonio and Molly to `royal_pigeon_inn`.
- Continue to node `molly_celebration_dinner`.

---

## Node: Celebration Dinner

**Node ID:** `molly_celebration_dinner`  
**Location:** `royal_pigeon_inn`
**Image:** molly_academic_struggle_resolved.jpg large

### Text

The Royal Pigeon is warm and bustling, its dining room filled with the comfortable smells of roasted meat, fresh bread, and something rich simmering in the kitchen.

Mrs. Mathilda greets Molly with a knowing smile and leads you to a table already laid for two.

A few minutes later, a magnificent dinner arrives. Not merely a good dinner, but _your favorite dinner_, prepared with all the expensive little indulgences you've spent your student days admiring from a safe distance on other people's plates.

You stare at it.

"Molly, how did you know?"

She looks immensely pleased with herself.

"I asked around! And I may have mentioned that I wanted something special. You've been so kind to me, Antonio. I wanted to do something nice for you."

For a while, the two of you enjoy the meal, with Molly happily recounting the ordeal of her examinations. Apparently, one examiner had asked a question so dreadful that she'd briefly considered climbing out of the window.

Eventually, she grows thoughtful.

"There's still something I need to work on, though. Hordes."

She makes a face.

"I can craft a decent card when I put my mind to it, but actually _playing_ the things? Half the time I don't realize I've made a terrible move until my opponent is grinning at me."

She leans forward, a little hopeful.

"I was thinking... would you like to train together? Wednesday evenings, in my room? We could play matches, try different decks, that sort of thing. I promise I'll be a very enthusiastic student!"

She pauses.

"Not necessarily a _good_ student, mind you. But enthusiastic."

### Options

#### Option A: Agree to train with Molly

**Text:**

"Wednesday evenings sound good to me."

Molly breaks into a delighted smile.

"Really? Oh, that's wonderful! I'll make sure we have everything ready. Cards, a proper table, perhaps something to eat..."

She considers this for a moment.

"Actually, knowing me, definitely something to eat."

Then she reaches into her satchel.

"And before I forget, there's one more thing. I made some cards recently, and I'd love you to have one. Think of it as a little celebration present."

**Outcomes:**

- Schedule recurring training activity with Molly, every Wednesday evening, at `molly_room`.
- Offer Antonio a choice of one card from three randomly selected cards in the `molly,base` collection.
- Add memory `molly_memory_wednesday_training`, known by molly: Molly smiles eagerly. "I'm looking forward to our next Hordes session! I've been working on a new deck. I think I've finally figured out how to stop losing all my good units before they can do anything." She pauses. "Well, most of them."

#### Option B: Decline the regular training

**Text:**

You explain that you can't commit to regular Wednesday evenings, though you'd be happy to play the occasional match.

"Oh, of course!" Molly says, entirely understanding. "I know you've got your own studies and everything. It was just an idea."

Her smile returns almost immediately.

"Besides, I suppose I'll have to learn to win without someone holding my hand. Metaphorically speaking!"

She retrieves a few playing cards from her satchel and spreads them across the table.

"Anyway, pick one of these. A little present to celebrate my glorious ascent into the ranks of the academically adequate!"

**Outcomes:**

- Offer Antonio a choice of one card from three randomly selected cards in the `molly,base` collection.
- Add memory `molly_memory_passing_exams`, known by molly: Molly smiles when you ask about her studies. "Much better, thank you! I still have to work harder than most people, but at least I'm not terrified of every examination anymore. And I haven't forgotten that lovely dinner we had at the Royal Pigeon."
