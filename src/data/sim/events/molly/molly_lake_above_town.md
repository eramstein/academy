# Event: The Lake Above Town

**NPC:** molly  
**Event ID:** `molly_lake_above_town`  
**Trigger:** Molly friendship >= 3; Molly love >= 1; weekend; morning  
**Image:** large  
**Emotion:** happy

## Text

Molly finds you just as you are contemplating the rare and precious luxury of a morning without lectures.

"Antonio! You're free today, aren't you? Wonderful! There's a lake in the hills above town. It's beautiful, and hardly anyone ever goes there. We could walk up, have a picnic, and go swimming!"

This is less an invitation than a small avalanche of enthusiasm. Before you've had time to decide how ambitious you feel, Molly produces an enormous picnic basket from behind her back.

"I made sandwiches! And there are apples, cheese, honey cakes... Oh, and towels. Don't worry about carrying it all, I'm quite used to hiking."

So much for a restful morning. Still, the prospect of spending a sunny day with Molly has its attractions. You agree, and she leads you out of town at a brisk pace, chattering about birds, wildflowers, and a fox she once spent three days trying to befriend. The fox, by her account, remained disappointingly committed to being a fox.

An hour later, the path opens onto a little mountain lake, clear and blue beneath a ring of green slopes. Sunlight dances on the water. A willow leans over the shore, and a grassy bank offers an ideal place for the picnic. There isn't another soul in sight.

Molly drops the basket and surveys the scene with satisfaction. "Perfect! I told you it was worth the walk."

She sets aside her walking clothes, revealing simple, opaque linen underclothes: a cream sleeveless top and loose dark-green shorts, both thoroughly practical for swimming. She seems no more self-conscious about this than she would about removing a raincoat. You, on the other hand, have suddenly become very interested in the local geology.

"Coming in?" she asks, stepping toward the water. "It's lovely once you get used to it!"

An inviting lake, a beautiful day, and Molly smiling at you over her shoulder. There are worse ways to spend a weekend.

## Options

### Option A: Race her into the lake

**Text:**

You shed your outer clothes, keeping your own modest swimming underclothes, and head for the water. "Last one in has to carry the basket home!"

"Oh, that's not fair!" Molly cries, already running. "You've got a head start!"

She overtakes you before your feet touch the shallows. The first plunge is shockingly cold; your breath vanishes, along with several of your more dignified intentions. Molly surfaces beside you, laughing, and flicks a handful of water in your direction.

You retaliate. A spirited exchange follows, interrupted by a swim toward a sun-warmed rock on the far shore. Molly moves through the water as easily as she does over land, but she slows so you can enjoy the crossing together.

By the time you return, you're pleasantly exhausted. Molly wraps herself in a towel and passes you a honey cake. "That was wonderful! We ought to come here more often."

You consider the long walk home. Then the cake. On balance, she makes a persuasive argument.

**Outcomes:**

- Molly friendship +1.
- level up Vitality +1
- Add story tag `molly_lake_swim`.
- Add memory `molly_memory_lake_swim`, known by molly: Molly's eyes brighten. "Do you remember our race into the lake? I still say you started early!" She laughs. "Not that it helped you very much. We should go back when the weather's lovely."

### Option B: Enjoy the shore together

**Text:**

"I think I'll stay here for a while. Someone ought to defend the picnic from marauding wildlife."

Molly considers this. "A very important responsibility. Especially where honey cakes are concerned."

She goes for a swim while you settle beneath the willow. Watching her splash happily in the blue water, you find that doing absolutely nothing is an occupation with considerable merit.

When Molly returns, she stretches out on a towel beside you and opens the basket. Between mouthfuls of bread and cheese, she points out plants growing along the bank: a cooling herb useful for minor burns, soft moss prized by green artificers, and a little blue flower whose name she can't quite remember.

"I'm not very good at remembering the scholarly names," she admits. "But I know what grows where. My old gardener taught me when I was small."

Together you collect a few useful specimens without disturbing the rest. The afternoon passes in easy conversation, occasional comfortable silences, and one determined attempt by a duck to negotiate a share of the sandwiches. Molly insists that the duck is being perfectly polite.

**Outcomes:**

- Molly friendship +1.
- Get resources: 10 magic dust
- Add character discovery: Molly has extensive practical knowledge of wild plants, learned during her childhood outdoors.
- Add story tag `molly_lake_picnic`.
- Add memory `molly_memory_lake_picnic`, known by molly: "I found another place that reminds me of our picnic," Molly tells you. "Quiet water, trees, absolutely no one demanding that we study." She thinks for a moment. "Well, there was that duck. But he only demanded sandwiches."

### Option C: Find out what Molly has in mind

**Next:** molly_lake_fun

**Text:**

You follow Molly toward the shallows. Something about her smile suggests she's enjoying this invitation for reasons that may have very little to do with swimming.

**Outcomes:**

- No additional game-state effects.

## Node: molly_lake_fun

**Title:** A Curious Growth Phenomenon  
**Emotion:** flirtatious
Image: large

Molly wades in enthusiastically, swims several yards, and turns to wave.

"Come on! Don't be shy!"

You're beginning to suspect that Molly is considerably less shy than she sometimes appears. Well, there's only one thing for it. You leave your shirt and trousers on the bank, keeping your modest swimming underclothes, and try to ignore the enormous grin with which Molly observes your preparations.

You join her in the water. Almost immediately, a small complication presents itself. Molly's practical linen swimming top, perfectly modest on dry land, has become rather less discreet now that it's soaked. Apparently, the lake has very strong opinions about the laws of transparency.

You're doing your best to behave like a civilized scholar when Molly notices that the view has had a noticeable effect on your composure. Her eyes widen for a heartbeat. Then she breaks into a delighted, wicked little smile.

"Well, Antonio! It seems I'm not the only one who knows how to cast Giant Growth. And I thought you only used that card in _Hordes_!"

There are moments when a rigorous education in magical theory is of absolutely no assistance whatsoever.

Molly glides closer, still smiling. "If you'd like," she adds, lowering her voice, "I could try reversing the effect."

_Gulp._

**On enter:**

- Add character discovery: Molly is definitely not as shy as you thought. If she proposes you some sportive activity, be prepared.

### Option C1: Let her try

**Check:** vitality hard

**On success:**

**Next:** molly_lake_gift

**Text:**

You return Molly's smile and draw her gently closer. That, apparently, is all the encouragement she needs.

There follows a considerable amount of splashing, fresh evidence of Molly's formidable wrestling skills, and the abrupt departure of several scandalized birds. The rest is a private matter between two consenting scholars, and the local wildlife has already heard quite enough.

When you finally gather your thoughts, you're standing in the shallows with Molly close against you, her legs wrapped securely around your waist. Both of you are breathless; Molly looks positively radiant.

"Antonio," she whispers into your ear, "we can do that again whenever you like. With or without the water."

She laughs and kisses you. "Just for fun, you know? When we both feel like it. No need to decide the rest of our lives over a swim."

You agree. A remarkably sensible arrangement, considering the astonishing lack of sensible behavior that produced it.

**Outcomes:**

- Molly love +2.
- Add story tag `molly_lake_intimate`.
- Add relationship tag `molly_just_for_fun` (Molly is not as shy as you thought).
- Add memory `molly_memory_lake_intimate`, known by molly: Molly gives you a mischievous smile. "I've been thinking about that afternoon at the lake. I had no idea swimming could be quite so entertaining." She blushes a little. "We really ought to go again sometime."
- Add lore `molly_lore_lake_growth`, speaker emma: Emma greets you with a smile of positively dangerous innocence. "Antonio! Molly was telling me about your excursion to the lake. Apparently there was a rather remarkable demonstration of Giant Growth." You open your mouth to object. "Oh, spare me the technical details. I only wish to congratulate you on finally discovering an application of green magic that inspires genuine enthusiasm for your studies." Her raised eyebrow suggests that further objections would merely improve her afternoon.

**On failure:**

**Next:** molly_lake_gift

**Text:**

You return Molly's smile, and she meets you halfway with a delighted kiss.

There follows a considerable amount of splashing, further evidence of Molly's remarkable wrestling skills, and the abrupt evacuation of several nearby birds. The problem is resolved right there in the lake. Promptly. Perhaps a little _too_ promptly.

Back on the bank, Molly spreads her damp things over a sun-warmed stone. She catches your sheepish expression and laughs—not unkindly, but with infectious amusement.

"Don't worry, Antonio. My enthusiasm does have a way of being contagious." She leans close and lowers her voice. "Next time..." A very knowing smile. "...I'm sure you'll take a little more time."

_Next time._ There are encouraging phrases, and then there are phrases capable of restoring an entire man's self-confidence.

"If you'd like a next time, that is," Molly adds, suddenly a little shy. "I would. Something just for fun, now and then, without making a grand fuss about it."

You tell her you'd like that too. Molly squeezes your hand, plainly delighted with the arrangement.

**Outcomes:**

- Molly love +1.
- Add story tag `molly_lake_intimate`.
- Add relationship tag `molly_just_for_fun` (Molly is not as shy as you thought).
- Add memory `molly_memory_lake_intimate`, known by molly: Molly smiles and gives your hand a squeeze. "Do you remember our afternoon at the lake? It was lovely, Antonio." Her expression turns impish. "And next time, perhaps we won't be in quite such a hurry."
- Add lore `molly_lore_lake_growth`, speaker emma: Emma greets you with a smile of positively dangerous innocence. "Antonio! Molly was telling me about your excursion to the lake. Apparently there was a rather remarkable demonstration of Giant Growth." You open your mouth to object. "Oh, spare me the technical details. I only wish to congratulate you on finally discovering an application of green magic that inspires genuine enthusiasm for your studies." Her raised eyebrow suggests that further objections would merely improve her afternoon.

### Option C2: A strategic retreat

**Next:** molly_lake_gift

**Text:**

Oh, dear. That wasn't a bluff.

A strategic withdrawal is clearly in order. Red as a tomato, you begin edging toward the shore, doing your best to conceal the source of Molly's rapidly growing amusement.

"It's just that... you know, reflections in water can create rather misleading impressions of submerged objects..."

Molly nods with exaggerated seriousness. "Oh, yes! Professor Lombard was explaining that in class the other day."

For one glorious moment, you think you've been saved by academic rigor.

"That must be it, of course," she continues solemnly. "Still, I'll be sure to record the results of our experiment."

She bursts into laughter. You cannot help joining in, even as you retreat to the towels with what little dignity remains. Molly follows, cheerful as ever, and offers you a honey cake as a peace treaty.

**Outcomes:**

- Molly friendship +1.
- Add story tag `molly_lake_retreat`.
- Add memory `molly_memory_lake_retreat`, known by molly: Molly covers a smile with her hand. "You know, Antonio, I've been thinking about Professor Lombard's lesson on refraction. Such a fascinating subject!" Her eyes sparkle. "We really should repeat our little experiment someday."
- Add lore `molly_lore_lake_retreat`, speaker emma: Emma studies you with an expression of refined disbelief. "Molly told me about your little swimming expedition. She apparently proposed a most interesting practical experiment, and you fled—citing Professor Lombard's lecture on refraction." She pauses to let this sink in. "Fibonacci, I've always admired a man who knows when to retreat. But to abandon such a promising opportunity in the name of _optics_? Your judgment requires urgent remedial instruction." She looks entirely too pleased with herself.

## Node: molly_lake_gift

**Title:** A Parting Gift  
**Emotion:** amused

As you gather the picnic things, Molly suddenly brightens. "Oh! I nearly forgot. I brought you something."

She fishes a green magic card out of a dry pocket in her basket and presents it with a flourish: **Giant Growth**.

{{giftJoke}}

The card is genuinely useful. Molly's pleasure in giving it to you is genuine, too. Her sense of comic timing, however, may be developing into a public menace.

**On enter:**

- Give Antonio card `molly_giant_growth`.

**Passages:**

giftJoke

When: Story tag `molly_lake_retreat` is present

"For your future experiments," she says, with exaggerated scholarly dignity. "In case you decide the optical conditions are more favorable next time."

Otherwise:

"I thought you deserved a souvenir of our afternoon," she says, blushing and smiling at once. "Though judging by what happened earlier, perhaps you didn't need the extra growth after all!"
