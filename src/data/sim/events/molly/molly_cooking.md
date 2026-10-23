# Event: Kitchen Volunteers

**NPC:** molly  
**Event ID:** `molly_kitchen_volunteers`  
**Trigger:** Day >= 10; Molly friendship >= 1;
**Image:** large
**Emotion:** surprised

## Text

The smell reaches you before the noise: onions, fresh bread, and something that may once have been soup but is currently reconsidering its place in the world.

You follow the commotion to the Academy cafeteria kitchen. A cook is trying to rescue a boiling pot, an assistant is counting plates with the expression of a defeated general, and Molly stands in the middle of it all wearing an enormous borrowed apron. Her cheeks are flushed, her sleeves rolled up, and three vegetables are balanced precariously against her elbow.

"Antonio! Thank goodness!" she cries. One of the vegetables escapes. "I only came to help with lunch. They were short-handed, and I thought, how difficult can chopping and stirring be?"

There are many possible answers. The state of the kitchen suggests she has been discovering them experimentally.

{{referral}}

Molly points to the great pot. "I followed the recipe! Well, most of it. I was trying to make enough for everyone, so I multiplied everything by four. Including the salt." She lowers her voice. "And perhaps the pepper."

The head cook, a broad-shouldered woman with flour on both forearms, looks you over. "If you're here to help, pick a station. If you're here to admire the disaster, take a number."

Molly clasps her hands hopefully. "Oh, Antonio, will you? I really do want to be useful."

## Conditional passages

### referral

**When:** story tag emma_memory_cooking_reputation

Emma is leaning against the doorframe, having evidently delivered you to the scene with the air of a scholar unveiling an important discovery. "I recommended you," she announces. "After tasting Antonio's cooking, I thought you deserved competent assistance. Also, if I have to eat what is currently in that pot, I intend to hold somebody accountable."

"Emma!" Molly looks scandalized. "It isn't _that_ bad."

Emma samples one cautious spoonful. Her face remains admirably composed. "No. Quite right. The salt is excellent. One can almost detect a soup underneath it."

Molly looks at you helplessly as Emma retreats toward lunch, her good deed apparently complete.

**Otherwise:**

"One of the staff told me you've worked in a proper kitchen," Molly explains. "I hope you don't mind that I asked them about you. I wasn't spying! I just thought you might know how to save lunch." She surveys the pots and gives you an apologetic smile. "You could say it's a little urgent."

## Effects

- Add story tag `molly_kitchen_volunteers_seen`.
- Add to Molly's known traits: **Eager but inexperienced:** Molly readily volunteers for practical work, but enthusiasm sometimes outruns her knowledge. She can admit mistakes and is keen to learn rather than leave the work to others.

## Options

### Option A: Teach Molly a recipe she can make again

**Text:**

"First," you say, gently removing a knife from beneath a precarious pile of carrots, "let's make something simple. Something that won't require an emergency committee."

Molly nods with deep seriousness. "Excellent. An emergency committee sounds terribly time-consuming."

You show her how to prepare a sturdy vegetable stew: brown the onions, cut the vegetables to similar sizes, add stock gradually, taste before seasoning, and keep the heat low. Molly follows your hands carefully and asks questions—not always the expected ones. "How do you know when an onion is properly browned?" is followed by "Do onions mind being browned?" The latter requires a moment of reflection from everyone involved.

When the stew is ready, the head cook tastes it and nods. "Good. And she made most of that herself."

Molly positively glows. "I did! Well, Antonio stopped me from adding four times the salt again, but otherwise I did!"

After the meal, the cook presents you with a compact, well-kept kit of utensils and measuring implements. "We have a spare. A cook who teaches instead of shouting can put it to use."

Molly takes your hand in both of hers. "Next time, perhaps I can cook something for you. Something edible, I mean."

**Outcomes:**

- Gain possession of type `tool` named **Cooking set**
- Molly friendship +2.
- Add story tag `molly_kitchen_learned_recipe`.
- Add memory `molly_memory_kitchen_recipe`, known by molly: Molly beams when you mention cooking. "I've been practicing the stew you taught me! I even remembered to taste it before adding salt." She lowers her voice conspiratorially. "The cook says that's the first principle of not poisoning an entire dining hall."

### Option B: Bring order to the chaos

**Text:**

You take stock of the room. There are six cooks, three chopping boards, enough potatoes to provision an army, and no clear idea who is doing what. The ingredients are fine. The arrangement is a catastrophe wearing an apron.

"Molly, take charge of washing and sorting the vegetables. Ask the cooks what they need first. I'll clear the worktops and set up stations."

"Me? Take charge?" She looks alarmed, then glances at the exhausted assistants. "All right! Everyone, please tell me what you need. One at a time—oh! Sorry, I was shouting too."

You separate preparation from cooking, move the flour away from the washbasin, and get the assistants working in a sensible order. Molly turns out to have a gift for remembering whose hands are full and who has been waiting too long for help. Once the work has a rhythm, she keeps it going with cheerful, practical attention.

By lunchtime the dishes arrive hot, the plates arrive clean, and the kitchen is quiet enough to hear the head cook mutter in disbelief.

"I was going to send these back to the workshop," she says, handing you three unused moxes from a box of surplus kitchen requisitions. "They'll do more good in an artificer's hands. Consider them thanks for saving the service."

Molly looks at the tidy counters, pleased but thoughtful. "I wanted to do everything myself. It turns out asking everyone what they need works rather better."

**Outcomes:**

- Gain **3 moxes** (crafting ingredients; exact inventory key to confirm).
- Molly respect +1.
- Molly friendship +1.
- Add story tag `molly_kitchen_organized`.
- Add memory `molly_memory_kitchen_organized`, known by molly: "I tried your kitchen trick again," Molly tells you proudly. "I asked everyone what they needed before doing anything. It worked wonderfully!" She hesitates. "I did still burn the onions. But nobody had to wait for a plate."

### Option C: Experiment with green essence

**Text:**

You notice a small rack of culinary artificery cards beside the stove: common green-essence tools for preserving herbs, coaxing vegetables to ripen, and keeping produce fresh on long journeys. Molly catches your glance and immediately brightens.

"Oh! We could use those! Do you think one could fix the soup?"

"The soup has made its choices," you say. "Let's start with the vegetables."

You select a harmless growth-aspected card and carefully adjust its application to a tray of wilted herbs. Under the cook's watchful eye, the leaves straighten, turn fresh green, and release a vivid fragrance. Molly is delighted. She offers suggestions, helps you compare the effects on different leaves, and discovers that a small, controlled influence produces much better results than the enthusiastic overuse she initially proposes.

The cook adds the revived herbs to a new pot. This time, when she tastes the result, her eyebrows rise in genuine approval.

"There," Molly says, looking from the herbs to the card in your hand. "I've never understood green essence so well in class. Apparently I needed it explained by a parsley leaf."

You find yourself understanding its practical behavior more clearly, too. A lesson learned over a boiling pot is still a lesson—even if nobody will award you a scholarly medal for it.

**Outcomes:**

- **TeachColor green** .
- Molly friendship +1.
- Add story tag `molly_kitchen_green_essence`.
- Add memory `molly_memory_kitchen_green`, known by molly: Molly smiles at you. "I used that green-essence trick on some herbs again! Very carefully, just as you showed me." She pauses. "The parsley was splendid. The basil was rather enthusiastic. I'm still working on the basil."
