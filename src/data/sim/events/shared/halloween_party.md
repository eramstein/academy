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
**Image:** emma_halloween_party.jpg large
**Emotion:** amused

Emma proves an excellent companion for an evening of mild chaos. She informs Professor Glützenbaum that his vampire disguise is undermined by the crumbs in his beard. He replies that these are _historically accurate_ crumbs.

You catch Emma examining the punch, one delicate eyebrow raised. "Do you suppose the professor has realized we're both vampires? I'm afraid the Academy's supply of victims is rather limited."

An answer springs to mind. It involves vampires, sucking, and Emma. It is, by every reasonable measure, an appalling idea.

_No,_ advises the small, overworked part of your brain responsible for preserving your dignity. _Don't say it. Whatever you're thinking, don't._

Unfortunately, the rest of your brain has already begun constructing the sentence.

### Option A: Try **not** to make the joke

**Check:** intelligence impossible
**On success:**

- **Next:** emma_cuts_you_off

**On failure:**

- **Next:** emma_cuts_you_off

**Text:**

You summon every scrap of intellect at your disposal in a desperate attempt to keep your mouth shut.

**Outcomes:**

- No additional game-state effects.

## Node: emma_cuts_you_off

**Title:** An excellent prevention
**Emotion:** amused

Emma watches your expression change. Her eyes narrow behind her glasses.

"No."

You haven't said anything yet.

"I can see the joke forming, Antonio. You have exactly the face of a man about to say something about vampires sucking." She holds up one finger. "And before you ask: yes, I thought of it first. No, you may not hear my version. It was better."

You open your mouth to protest. She raises a second finger.

"Careful. That would be your second mistake, and it's still early."

The narrator would like to congratulate Emma on averting a catastrophe. The narrator would also like to point out that you were only _considering_ a catastrophe.

Before you can defend yourself, Emma spots Molly across the room, happily passing pastries to a pair of nervous first-year students. An unmistakable gleam appears in Emma's eyes.

"Now," she says, drawing herself up to her full aristocratic vampire height, "watch a professional."

### Option A: Follow Emma's demonstration of terror

**Next:** emma_scares_molly

**Text:**

You follow at a discreet distance, eager to see whether Emma's confidence is justified.

**Outcomes:**

- No additional game-state effects.

## Node: emma_scares_molly

**Title:** A fearsome predator
**Emotion:** happy

Emma approaches Molly from behind, gliding silently between the tables. She bares her little costume fangs and whispers into Molly's ear, in her most dreadful voice, "Beware, mortal. Your blood is mine."

Molly turns around. "Emma! You look _wonderful!_"

Before Emma can retreat, Molly wraps her in an enormous werewolf hug. Emma's elegant cape gets trapped under a furry paw, and her carefully arranged collar folds over one ear.

"Molly," comes a muffled voice, "this is not how the encounter is supposed to work."

"Oh! Sorry!" Molly loosens her grip. "Was I meant to be frightened? Shall we try again?"

"Absolutely not." Emma straightens her collar with the dignity of a deposed monarch. "My reputation has suffered enough."

Molly grins, pats Emma's shoulder, and goes back to distributing pastries. Emma watches her leave.

"There's no reasoning with werewolves," she mutters. "They're all teeth and unconditional affection."

The musicians strike up a lively dance, offering Emma a convenient escape from further humiliation. She turns to you and extends a hand.

"Come on, Fibonacci. Perhaps I can salvage this evening by defeating you at something civilized."

### Option A: Accept the challenge

**Next:** emma_dance

**Text:**

You take her hand. "Is dancing really a competition?"

"Not ordinarily," Emma says. "But you've met me."

**Outcomes:**

- No additional game-state effects.

## Node: emma_dance

**Title:** The vampire waltz
**Emotion:** happy

{{ emmaDance }}

You join the dancers. Emma moves with practiced grace, although tonight she seems more interested in having fun than in getting every step right. When you nearly collide with a student dressed as an enormous mushroom, she pulls you aside at the last instant—and laughs hard enough to miss a step herself.

"Not a word, Fibonacci. Nobody saw that."

"The mushroom saw."

"The mushroom knows what's good for him."

**Passages:**

### emmaDance

**When:** Story tag `emma_ballet_shared_evening` is present

"You remember our last dance, don't you?" she asks. "I've decided to measure your progress. I may even publish the results. Anonymously, if they're dreadful."

**Otherwise:**

"Don't look so alarmed," she says. "I promise not to grade your footwork. I left the marking rubric at home."

### Option A: Tell her she's enjoying herself

**Next:** emma_gift

**Text:**

"You know, I don't think I've ever seen you laugh quite so much."

"That's because you're usually too busy giving me reasons to sigh." Emma considers this, then smiles. "But perhaps I've been taking myself a little too seriously. Don't tell anyone. I have an image to maintain."

She squeezes your hand briefly as the music carries you both back into the crowd.

**Outcomes:**

- No additional game-state effects.

### Option B: Challenge her to one more dance

**Next:** emma_gift

**Text:**

"One more? Unless you're afraid I might outdance you."

Emma looks delighted. "There it is. The brave confidence of a man who has learned absolutely nothing."

She takes your hand and leads you straight back onto the floor. You suspect you've just committed yourself to a very long evening.

**Outcomes:**

- No additional game-state effects.

## Node: emma_gift

**Title:** A little something
**Emotion:** happy

The party is winding down when Emma draws you aside, away from the music. From a small pocket in her gown she produces a card depicting a bespectacled vampire with a smug little smile. The resemblance is difficult to miss.

"A seasonal experiment," she explains. "Entirely frivolous, academically indefensible, and remarkably effective. I thought you'd appreciate a card with some intelligence behind the fangs."

You glance at the illustration. "You gave yourself glasses."

"Of course. I'm not going to spend eternity squinting."

She places the card in your hand. "And before you ask, it isn't a declaration of undying devotion. That would be terribly on the nose, given the costume."

Her smile softens. "Thank you for inviting me, Antonio. I had a lovely evening. Even if my reign of terror lasted approximately four seconds."

**On enter:**

- Gift card `emma_halloween` to Antonio.
- Emma friendship +1.
- Add story tag `halloween_party_emma_completed`.

## Node: molly_halloween_party

**Title:** The gentlest werewolf
**Image:** molly_halloween_party.jpg large
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
