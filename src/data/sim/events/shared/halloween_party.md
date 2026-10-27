# Event: A Night of Masks

**Event ID:** `academy_halloween_party`
**Trigger:** Scheduled `academy_halloween_party` activity; Saturday evening
**Emotion:** happy

## Text

For one evening, the Academy cafeteria has been transformed beyond recognition. Paper bats hang from the rafters, carved pumpkins grin from every windowsill, and strings of little enchanted lights drift lazily above the tables. Someone has pushed the benches aside to make room for dancing. The kitchen staff, apparently delighted to have an excuse to abandon their usual menu, have prepared enough pastries to sustain a small siege.

A tall figure in a black cloak stands beside the refreshments, inspecting a bowl of punch with professional suspicion. It takes you a moment to recognize Professor Glützenbaum.

"Fibonacci," he says. "Welcome. I am a vampire."

"Very convincing, Professor."

"Thank you. I have been assured that the costume is historically accurate. Do not drink the purple punch. I am told it contains an alarming quantity of sugar."

He takes a generous glass of it himself.

{{ arrival }}

## Conditional passages

### arrival

**When:** Story tag `halloween_with_emma` is present

Near the entrance, Emma is waiting for you, dressed as an elegant vampire in a dark, perfectly tailored gown, her pale makeup and neatly pinned hair lending her an almost aristocratic severity. The effect is striking. Her expression, however, is unmistakably Emma's.

"Well, Fibonacci?" She spreads her hands slightly. "Am I sufficiently dreadful?"

**When:** Story tag `halloween_with_molly` is present

Molly appears beside the doorway wearing a wonderfully elaborate werewolf costume, complete with furry ears, a bushy tail, and a pair of padded paws. She gives a fierce little growl, then immediately bursts out laughing.

"Sorry! I've been practicing that all afternoon. Was it scary?"

**Otherwise:**

You arrive without a companion, but hardly unnoticed. Ousmane, dressed as a pirate of remarkable elegance, greets you with a sweeping bow. Farid has come as a masked highwayman, a costume that appears to require suspiciously little preparation. They wave you toward the refreshments.

## Options

### Option A: Join Emma for the evening

**Only if:** Story tag `halloween_with_emma` is present
**Next:** emma_halloween_party

**Text:**

"Terrifying," you assure her. "I nearly fled."

"How disappointing. I was hoping for actual screaming." Emma offers you her arm. "Come along. I believe the professor is about to discover what happens when one drinks four glasses of punch in quick succession."

**Outcomes:**

- No additional game-state effects.

### Option B: Join Molly for the evening

**Only if:** Story tag `halloween_with_molly` is present
**Next:** molly_halloween_party

**Text:**

"Absolutely terrifying," you say.

Molly beams. "Good! Though I think the tail makes it a little difficult to look menacing."

She takes your hand and draws you into the room before you can offer a more detailed assessment.

**Outcomes:**

- No additional game-state effects.

### Option C: Explore the festivities

**Only if:** Story tag `halloween_going_alone` is present
**Next:** solo_party

**Text:**

You make for the food, where a plate of suspiciously lifelike marzipan fingers has attracted a small crowd. If this is what the Academy calls terror, you are prepared to face it bravely.

**Outcomes:**

- No additional game-state effects.

## Node: emma_halloween_party

**Title:** A dance with a vampire
**Image:** academy_halloween_emma.jpg large
**Emotion:** happy

Emma proves an excellent companion for an evening of mild chaos. She offers devastatingly polite compliments to Ousmane's pirate outfit, persuades Farid to demonstrate his most theatrical bow, and informs Professor Glützenbaum that his vampire disguise is undermined somewhat by the crumbs in his beard.

When the musicians strike up a lively dance, she turns toward you. "Well? You didn't invite me here merely to watch me eat pastries, I hope."

{{ emmaDance }}

You join the dancers. Emma moves with practiced grace, but tonight she seems less concerned with perfection than with enjoying herself. When you nearly collide with a student dressed as an enormous mushroom, she catches your arm and laughs so hard that she misses a step herself.

"Not a word, Fibonacci," she warns, still laughing. "That never happened."

**Passages:**

### emmaDance

**When:** Story tag `emma_ballet_shared_evening` is present

"You remember our last dance, don't you?" she asks. "Let's see whether you've improved since then."

**Otherwise:**

"Don't look so alarmed," she says. "I promise not to grade your footwork. Strictly speaking, I'm off duty."

### Option A: Tell her she's enjoying herself

**Next:** emma_gift

**Text:**

"You know, I don't think I've ever seen you laugh quite so much."

Emma gives you a thoughtful look. "Perhaps I should spend less time being sensible. Don't tell the professor I said that."

She squeezes your hand briefly before the music carries you both back into the crowd.

**Outcomes:**

- No additional game-state effects.

### Option B: Challenge her to one more dance

**Next:** emma_gift

**Text:**

"One more?" you ask. "Unless you're afraid I might outdance you."

Emma looks positively delighted. "Oh, Antonio. You really should know better by now."

She takes your hand and leads you straight back onto the floor. You suspect you've just committed yourself to a very long evening.

**Outcomes:**

- No additional game-state effects.

## Node: emma_gift

**Title:** A little something
**Emotion:** happy

The party is winding down when Emma draws you aside, away from the music. From a small pocket in her gown she produces a card, its illustration showing a mischievous vampire surrounded by elegant blue enchantments.

"I made this earlier in the week," she says. "A seasonal experiment. Entirely frivolous, academically indefensible, and rather good, if I say so myself."

She places it in your hand. "I thought you might like it. And before you ask, no, it isn't a declaration of undying devotion. That would be terribly on the nose, given the costume."

Her smile softens. "Thank you for inviting me, Antonio. I had a lovely evening."

**On enter:**

- Gift card `emma_halloween` to Antonio.
- Emma friendship +1.
- Add story tag `halloween_party_emma_completed`.

## Node: molly_halloween_party

**Title:** The gentlest werewolf
**Image:** academy_halloween_molly.jpg large
**Emotion:** happy

Molly throws herself into the festivities with infectious enthusiasm. She insists you sample the pumpkin pastries, introduces you to half a dozen students you already know, and somehow becomes involved in a contest to see who can make the most convincing monster noise.

Her attempt at a werewolf howl is impressive. Unfortunately, it is immediately followed by a fit of giggles. Ousmane awards her second place, on the grounds that the first-place contestant frightened him more and he refuses to admit it.

Later, the music slows. Molly glances toward the dancers, then back at you. "Would you like to dance? I'm not terribly good at the fancy steps, but I can usually manage not to tread on anyone."

You join the others, moving with considerably more enthusiasm than elegance. Molly laughs when you get the steps wrong and cheerfully admits when she does too. By the end of the song, you're both slightly breathless.

### Option A: Compliment her costume

**Next:** molly_gift

**Text:**

"You know, I think you make an excellent werewolf."

"Really?" Molly looks delighted. "I spent ages making the ears!"

She wiggles them experimentally, then dissolves into laughter. "All right, perhaps I'm not very frightening. But I'm having a wonderful time."

**Outcomes:**

- No additional game-state effects.

### Option B: Ask for another dance

**Next:** molly_gift

**Text:**

"Another one?" you ask.

Molly smiles. "I'd love to! Though I should warn you, I get a bit carried away when the music gets faster."

A moment later, the musicians oblige. You discover that this was not an idle warning.

**Outcomes:**

- No additional game-state effects.

## Node: molly_gift

**Title:** A handmade surprise
**Emotion:** happy

As the last guests begin collecting their cloaks, Molly stops you near the door. "Oh! I nearly forgot. I made something for you."

She produces a card from a little pouch at her waist. Its illustration depicts a cheerful woodland werewolf beneath a bright autumn moon, surrounded by curling green enchantments.

"I thought it would be fun to make a Halloween card," she explains. "And then I thought you might like to have it. It's not as clever as some of the things Emma makes, but I put a lot of care into it."

You turn it over in your hands. The craftsmanship is lovely, and Molly watches your reaction with hopeful anticipation.

When you thank her, she breaks into a radiant smile. "I'm so glad! And thank you for coming with me, Antonio. This was one of the nicest evenings I've had in ages."

**On enter:**

- Gift card `molly_halloween` to Antonio.
- Molly friendship +1.
- Add story tag `halloween_party_molly_completed`.

## Node: solo_party

**Title:** A perfectly respectable evening
**Emotion:** amused

Going alone turns out to have its advantages. You are free to wander between conversations, sample the entire pastry selection without negotiation, and observe the costume contest from a strategically safe distance.

Henry's elaborate ghost costume earns enthusiastic applause until he trips over his own sheet. Ousmane declares this a triumph of realism. Farid, meanwhile, wins a special mention for his highwayman costume, largely because nobody can establish whether he's actually wearing a costume at all.

At some point Molly pulls you into a group dance, Emma offers an amused commentary from the sidelines, and Professor Glützenbaum solemnly announces that the evening has been a great success. He is wearing a paper bat on his hat and appears entirely unaware of it.

You leave the cafeteria pleasantly tired, thoroughly fed, and in possession of several memories that should prove useful whenever your classmates become too dignified for their own good.

**On enter:**

- Add story tag `halloween_party_solo_completed`.
