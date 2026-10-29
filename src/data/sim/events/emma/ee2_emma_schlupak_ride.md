# Event: A Most Useful Afternoon

**NPC:** emma  
**Event ID:** `emma_schlupak_ride`  
**Trigger:** Sunday afternoon; story tag `emma_trusted_companion` exists.  
**Emotion:** happy

## Text

Emma finds you after lunch with a folded itinerary in one hand and the expression of someone about to make an offer you would be foolish to refuse.

"I have decided to take up riding," she announces. "It seems one cannot move in distinguished circles without eventually being expected to sit on a horse. I refuse to have my future ruined by a saddle."

"A sound academic concern."

"Quite. I've arranged two horses, equipment, and an afternoon's excursion through the countryside. The stablemaster assures me the animals are exceptionally docile." She pauses. "I thought you might like to come."

She offers you the itinerary, then draws it back before you can unfold it. "And before you ask: yes, I could go alone. I simply think your company might improve the experience. Don't make me regret saying so."

## Options

### Option A: Accept the invitation

**Next:** emma_the_ride

**Text:**

"How could I refuse an opportunity to see you conquer yet another discipline?"

"You are welcome to admire my progress from a safe distance," Emma says. "Ideally from a horse that is slower than mine."

She slips the itinerary into her pocket, looking quite pleased despite herself.

**Outcomes:**

- Emma friendship +1.

### Option B: Decline

**Text:**

You thank her, but tell her you have other plans this afternoon.

"Of course." She folds the itinerary with unnecessary precision. "I'll have to face the perils of respectable society without you."

Her smile returns. "If I return speaking exclusively about bloodlines and hunting parties, please intervene."

She leaves for the stables. It occurs to you that she had already arranged the outing for two.

**Outcomes:**

- Add lore `emma_lore_riding_lessons`, exclude emma: "Apparently Emma Delamain has taken up riding," your companion remarks. "She says it's useful for making connections in society. Though she did admit the countryside was rather lovely. I suspect she's discovered a pastime she enjoys."

## Node: emma_the_ride

**Title:** An Undignified Dismount
**Emotion:** happy
**Image:** large

The first stretch of the ride is glorious. Beyond the Academy's fields, the road winds between golden meadows and low stone walls. The dark line of the Schlupak forest lies across the distant hills. Emma sits remarkably straight in her saddle, watching the stablemaster's lesson pay off with each passing minute.

"Well?" she asks, guiding her horse alongside yours. "Do I look as if I belong at a country estate?"

You are still considering your answer when your horse decides to investigate a particularly interesting rut. The world tilts. Your boots lose their stirrups, and you land in the grass with a thud that thoroughly extinguishes any aristocratic aspirations you might have entertained.

"Antonio!"

Emma is off her horse almost before you have caught your breath. She drops to her knees beside you, one hand on your shoulder, the other hovering anxiously near your face. "Are you hurt? Where? Look at me."

You manage to assure her that you are whole, if somewhat less dignified. Only then does she exhale. Her fingers remain on your shoulder a moment longer than necessary.

{{almost_kiss}}

From the direction of the forest comes a long, wavering howl. Another answers it. Emma's horse jerks its head, tears free of the reins she has dropped, and bolts straight toward the trees. Your own horse, apparently possessed of better judgment, gallops back toward the Academy.

For a moment, you both stare after them.

"Well," Emma says faintly. "The stablemaster did say they were docile. He neglected to specify under what circumstances."

"Wolves?"

"Likely far away. But my horse is heading into Schlupak, and I'm responsible for him." She rises and brushes the grass from her skirts. "We have to find him."

**Passages:**

### almost_kiss

**When:** Emma love ≥ 4

You reach for the hand against your cheek. Emma notices, and for once has nothing clever to say. She is very close. Her gaze slips briefly to your lips; you lean toward one another, slowly enough that either of you could stop. Neither does—until the howl cuts through the afternoon.

**Otherwise:**

"You frightened me," she says, unexpectedly quiet. Then she notices her hand still resting on you and withdraws it. "Next time you wish to impress me, Antonio, I recommend remaining on the horse."

## Options

### Option A: Follow the tracks carefully

**Check:** intelligence medium

**On success:**

**Next:** emma_honey_clearing

**Text:**

You study the churned earth at the forest edge. The horse's prints are easy to distinguish from older tracks, and broken fern stems reveal where he left the path. You lead Emma along a winding but reliable trail.

"A convincing performance," she admits. "If your artificery career fails, you might consider becoming a bloodhound."

**Outcomes:**

- Add story tag `emma_ride_tracking_success`.

**On failure:**

**Next:** emma_honey_clearing

**Text:**

You follow a promising trail until it disappears in a patch of stones. A detour, two mistaken hoofprints, and a spirited disagreement about moss later, you finally hear contented chewing ahead.

"If we ever become lost together," Emma says, "I shall insist we disagree in a more orderly fashion."

**Outcomes:**

- Add story tag `emma_ride_tracking_failure`.

### Option B: Run after him

**Check:** vitality hard

**On success:**

**Next:** emma_honey_clearing

**Text:**

You sprint beneath the branches, vault a fallen log, and keep the flash of the horse's pale tail in sight. Emma follows, refusing to be left behind. You slow at last when the animal stops in a sunlit clearing.

Emma catches her breath beside you. "An excellent demonstration of speed. I trust you'll never ask me to applaud it while running."

**Outcomes:**

- Add story tag `emma_ride_tracking_success`.

**On failure:**

**Next:** emma_honey_clearing

**Text:**

The first hundred paces go splendidly. The next hundred convince you that horses possess a rather unfair advantage in the matter of legs. You lose him among the trees and spend a good while searching with Emma before a suspiciously satisfied snort gives him away.

"Your dedication is admirable," Emma says, supporting herself against a tree. "Your pace was, eventually, negotiable."

**Outcomes:**

- Add story tag `emma_ride_tracking_failure`.

## Node: emma_honey_clearing

**Title:** The Sweetest Crime
**Emotion:** happy
**Image:** large

The runaway stands in a clearing, entirely untroubled by his adventure. He has discovered a fallen, honey-filled comb beside an old hollow tree and is happily devouring its contents. Golden drops cling to his muzzle.

Emma steps forward, then freezes. "Antonio. Is that _Schlupak honey_?"

It is. Rare forest bees produce it in tiny quantities, and artificers prize it as a powerful crafting ingredient. A modest fortune is disappearing into a horse with no appreciation of market prices.

The horse looks up, chews thoughtfully, and goes back for more.

## Options

### Option A: Let him have his treat

**Only if:** Story tag `emma_ride_tracking_success` exists.
**Next:** emma_ride_home

**Text:**

"He's had quite a fright," you say. "Let him finish."

Emma looks from the comb to the horse, then to you. "You do realize what he's eating?"

"Every expensive mouthful."

She smiles, and reaches out to stroke the animal's neck. "I suppose he deserves a little comfort. And perhaps we do, too."

**Outcomes:**

- Emma love +1.
- Emma friendship +1.
- Schedule `emma_horse_gift` for the following day's evening.

### Option B: Save the precious honey

**Only if:** Story tag `emma_ride_tracking_success` exists.
**Next:** emma_ride_home

**Text:**

"Hold his reins," you tell Emma. "We can still rescue some of it."

While she calms the horse, you carefully collect three intact portions of the honeycomb. The animal watches your work with an expression of deep personal betrayal.

"A sound investment," Emma concedes, eyeing your prize. "Though I suspect he will never forgive you."

**Outcomes:**

- Gain 3 `SchlupakHoney`.
- Emma respect +1.

### Option C: Admire the world's most expensive snack

**Only if:** Story tag `emma_ride_tracking_failure` exists.
**Next:** emma_ride_home

**Text:**

By the time you reach him, the last useful drop has vanished. The horse stands amid the wreckage of a small fortune, honey dripping from his whiskers.

"We've been robbed," you say.

"By a creature that cannot count," Emma replies. She tries to maintain a severe expression. The horse sneezes. Emma bursts out laughing, and you soon join her, both of you helpless before the spectacle.

"Well," she says at last, wiping her eyes, "at least someone has had a profitable afternoon."

**Outcomes:**

- Emma love +1.
- Emma friendship +1.
- Schedule `emma_horse_gift` for the following day's evening.

## Node: emma_ride_home

**Title:** The Long Way Home
**Emotion:** happy
**Image:** large

Emma takes the reins, and together you guide the horse back to the path. With your own mount long gone, there is only one sensible way home: you share the saddle, Emma in front and you behind her, keeping the horse at a gentle walk.

The afternoon light turns amber over the fields. Emma occasionally points out a distant farmhouse or a peculiar shape in the clouds, but there are stretches when neither of you feels the need to speak. The road is narrow, the saddle is not designed for two, and every bend brings you a little closer together.

"I must say, Antonio, you're proving to be a remarkably comfortable riding accessory."

"Accessory?"

"Yes. A little bulky, perhaps, but quite effective at keeping me warm." She pauses, then adds sharply, "And before you say whatever disgraceful thing has just occurred to you, don't."

"I haven't said anything!"

"Precisely. I'd like to preserve that happy state of affairs."

You hear the smile in her voice. A moment later, she settles back against you, apparently deciding that her riding accessory might as well be put to good use.

"I had intended this excursion to improve my prospects in society," she says eventually. "Instead I've lost a horse, nearly lost you, and discovered that equestrian training involves rather more running than advertised."

"A wasted afternoon, then?"

"Not at all." She rests one hand lightly over yours for a moment. "I think I'd like to do something equally impractical again."

As the Academy comes into view, she straightens in the saddle. "Naturally, we shall tell the stablemaster that everything went precisely according to plan."

## On enter:

- Emma love +1.
- Add memory `emma_memory_schlupak_ride` for emma: Emma gives you a sidelong look. "I was considering another outing. Somewhere with fewer wolves, perhaps." You ask whether horses are included. "Only if you promise to remain on yours this time." She smiles. "Though I admit the journey back wasn't entirely unpleasant."
