# Event: Noble Conduct

**NPC:** molly  
**Event ID:** `molly_noble_conduct`  
**Trigger:** Day >= 8; Molly friendship >= 1
**Image:** large
**Emotion:** sad

## Text

You are crossing a side corridor of the Academy when you discover Molly on her knees, scrubbing a stubborn patch of ink from the stone floor. Beside her, two cleaners are moving a heavy bucket between them. Molly's sleeves are rolled to the elbows; she has acquired a streak of soot across one cheek and looks rather pleased with the arrangement.

"Antonio!" She waves the cloth at you. "Did you know the workshop drains clog if you wash powdered iron into them? I didn't! But Marta showed me how to clear one. It's quite clever, really."

"Lady Moreno?"

The voice comes from behind you. Elsa stands in the doorway, immaculately dressed, staring at Molly's wet sleeves. The cleaners straighten at once. Molly looks up with an open smile.

"Oh, hello, Elsa! Would you mind passing me that other rag?"

For a moment, the corridor is very quiet.

"You are the daughter of a duke," Elsa says, keeping her voice controlled. "Students here know that. So do the servants. You cannot simply kneel in the corridor and do their work for them."

"Why not? They had three people to clean the whole workshop, and someone spilled an entire bottle of—"

"Because you represent your family, Molly. If people see a noblewoman working as a scullery maid, they will not say what a generous heart she has. They will say the Morenos have forgotten their station. And the next time you need the staff to follow an instruction, what authority will you have left?"

Molly lowers the rag. "I wasn't giving anyone instructions. I was helping."

"Precisely." Elsa's glance flicks toward the cleaners. "That is the problem."

The words land harder than Elsa seems to expect. Molly blinks rapidly. Her mouth trembles; she tries to answer and cannot. A tear slips down her cheek, making a clean track through the soot. The cleaners look at their shoes. Elsa, suddenly aware of her audience, draws herself a little straighter.

"I don't mean to be cruel," she says, with unfortunate timing. "But someone ought to tell you."

Molly wipes her eyes on her sleeve. "You have. Thank you." Her voice is small, but quite steady by the end. She rises, sets down the cloth, and turns to the cleaners. "Marta, you said the storeroom is short of hands on Thursdays. I can come then, too. If you'll have me."

"Of course, miss," Marta replies softly.

Molly nods. She is still crying a little. Apparently, tears are not preventing her from making appointments.

Elsa looks between them, evidently dismayed that her lecture has produced the exact opposite of its intended effect. You have a moment to intervene.

## Effects

- Known trait — Molly: Criticism can hurt her deeply, even bringing her to tears, but she does not abandon a conviction simply because it is painful to defend. She respects the Academy's workers and volunteers alongside them.
- Known trait — Elsa: Elsa believes noble status carries public obligations, including maintaining visible distinctions between those who give orders and those who serve. She worries that disregarding such conventions weakens a family's authority.
- Add story tag `molly_noble_conduct_seen`.

## Options

### Option A: Challenge Elsa in front of everyone

**Text:**

"If a title is so fragile that a bucket of water can ruin it," you tell Elsa, "perhaps the title is the problem."

Elsa turns toward you. "How very easy to say when you have no family name to safeguard."

"You're right," you say. "I've had to earn the respect I get. Perhaps that explains my confusion."

It is not the most diplomatic answer of your academic career. Elsa's eyes narrow. She takes a small purse from her belt and puts several coins into Molly's hand, deliberately, where everyone can see.

"Very well. If we are employing noble daughters as cleaners, we should at least pay them properly. I would hate to be accused of exploiting your generosity."

She departs with the dignified speed of someone who desperately wishes to slam a door but has been denied a suitable door.

Molly stares at the coins. "Oh, that wasn't very kind of her." She glances toward the cleaners. "And it wasn't kind to them, either." Turning to you, she presses the purse into your palm. "Would you hold on to these? You can put them toward something useful. I don't want to keep them."

There is no triumph in her voice. She looks relieved that somebody challenged Elsa, but troubled by how much louder the whole business became.

**Outcomes:**

- Gain 150 gold
- Molly friendship +1.
- Elsa rivalry +1.
- Add story tag `molly_noble_conduct_challenged_elsa`.
- Add memory `molly_memory_noble_public`, known by molly: Molly gives you a rueful smile. "Thank you for defending me when Elsa spoke to me like that. I know you meant well." She hesitates. "Next time, perhaps we could do it without making the cleaners wish the floor would swallow them? They already have enough to deal with."
- Add memory `elsa_memory_noble_public`, known by elsa: Elsa regards you coolly. "I remember your little speech about titles and buckets, Fibonacci. A spirited performance. Unfortunately, governing a household requires rather more than spirited performances." A faint, reluctant smile appears. "Though I confess it was a memorable line."

### Option B: Stay with Molly after Elsa leaves

**Text:**

You let Elsa go without a reply. Instead, you kneel beside Molly and pick up the abandoned rag.

"I think you missed a spot," you say.

Molly gives a watery laugh. "I think I missed several. My eyes went all blurry. It's terribly inconvenient."

You work together in silence until Marta takes the bucket away. Only then does Molly sit back on her heels. "Elsa probably thinks she's helping me," she says. "Perhaps she is, in her own way. But she made Marta feel ashamed of letting me help. That's the part I can't bear."

"You can still help her," you say. "And you don't have to be cheerful every second of it."

"Thank goodness." Molly sniffs, then brightens. "Because I seem to have used up today's supply."

Later, she finds you with three cards laid out carefully in her hands. "I wanted to give you something for staying. Pick whichever you like! They're all useful, and I promise none of them have ever cleaned a drain."

**Outcomes:**

- Molly friendship +2.
- Gift 1 card out of 3 (molly, base) .
- Add story tag `molly_noble_conduct_comforted`.
- Add memory `molly_memory_noble_comfort`, known by molly: Molly smiles, a little shyly. "Do you remember when you stayed and helped me finish cleaning after Elsa's lecture? I was having an awful time of it. I don't think I even thanked you properly." She pauses. "Thank you. It meant more than you know."

### Option C: Ask the workers what would actually help

**Text:**

"Marta," you ask, "if Molly and I wanted to make this easier next week, what would you need?"

Marta eyes the bucket. "A second handcart would be a start. And a place to sort all the useful bits the workshops throw away. They leave everything mixed with broken glass, and we spend half our time picking through it."

Molly looks up, her tears momentarily forgotten. "They throw away useful materials?"

"Not useful to the professors," Marta says. "Useful to anyone willing to sort them."

You suggest a separate collection bin for metal offcuts and usable scraps. Molly immediately volunteers to speak to the workshop steward and arrange a cart; Marta insists that the staff decide where the bins go. Within a few minutes, the cleaners are explaining their work to two students who are, for once, listening.

When Elsa sees the discussion turning into a practical arrangement, she hesitates by the doorway. "A proper system would at least be preferable to noble students randomly scrubbing floors," she remarks. She considers the bins. "They ought to be labeled."

"That's a good idea!" Molly says earnestly. Elsa seems unsure what to do with the compliment.

A little later, Marta brings you a neatly wrapped bundle. "First things we rescued from the discard basket. You two can have them. Better used than melted down for nothing."

Inside are three small pieces of mithril. Astonishing, really, what an institution can overlook when somebody else is expected to sweep it up.

**Outcomes:**

- Gain resource **3 mithril**
- Molly respect +1.
- Molly friendship +1.
- Elsa respect +1.
- Add story tag `molly_noble_conduct_scrap_scheme` (Molly and staff establish a practical sorting arrangement; no recurring material income implied).
- Add memory `molly_memory_noble_solution`, known by molly: "Marta says the new sorting bins are working!" Molly beams. "It's funny—we meant to help clean the floor, and now they have less to clean in the first place. I wonder what else we've all been doing the difficult way?"
- Add lore `academy_lore_workshop_scraps`, speaker elsa: Elsa folds her arms. "That system for collecting workshop scraps? Yes, I heard about it. Sensible enough, once somebody remembered to involve the staff who actually do the work." She gives you a measuring look. "Do try not to look so astonished that I approve of something."
