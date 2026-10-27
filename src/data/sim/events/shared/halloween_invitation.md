# Event: An Invitation to Fright

**NPC:** glutzenbaum  
**Event ID:** `academy_halloween_invitation`
**Trigger:** Day >= 20; afternoon; class activity
**Emotion:** happy

## Text

Professor Glützenbaum enters the classroom carrying a large orange squash under one arm and a stack of papers under the other. He sets the squash on his lectern. It immediately rolls off, hits the floor with a magnificent thud, and continues toward the front row.

"A pumpkin," the professor announces, retrieving it with what dignity remains. "A traditional seasonal decoration. Not, as Mr. Ousmane has suggested, a new examination instrument."

Ousmane looks faintly disappointed.

"Next Saturday evening, the Academy will hold its annual Halloween celebration in the cafeteria. There will be refreshments, music, costumes, and absolutely no unauthorized conjurations. Last year's incident with the animated skeleton has still not been satisfactorily explained."

At the back of the room, Farid quietly puts something away in his bag.

"Attendance is voluntary," Glützenbaum continues. "Costumes are encouraged. Any student attempting to frighten the faculty into cancelling Monday's lessons will receive a failing grade in initiative."

The room erupts into excited conversation. Molly is already smiling; Emma looks thoughtful, as though evaluating the evening's potential benefits against several hours of lost study. You, meanwhile, have a decision to make. Parties are perfectly enjoyable alone. Then again, there are certain people whose company might improve the occasion considerably.

## Options

### Option A: Go on your own

**Text:**

You decide to keep your options open. An evening of food, music, and watching your classmates make fools of themselves sounds perfectly agreeable without any elaborate arrangements.

Besides, you have an entire week to devise a costume. Surely that is enough time to produce something respectable. Or at least something recognizable.

**Outcomes:**

- Add story tag `halloween_going_alone`.
- Schedule `academy_halloween_party` for next Saturday evening at the cafeteria. Participants are molly, emma, ousmane, elsa, vaiana, henry, the-dude and farid

### Option B: Invite Emma

**Next:** invite_emma

**Text:**

You catch Emma as the class disperses.

"Emma? About Saturday's party..."

She stops, regarding you with an attentive little smile. "Yes, Antonio?"

**Outcomes:**

- No additional game-state effects.

### Option C: Invite Molly

**Next:** invite_molly

**Text:**

You find Molly gathering her books, still looking delighted by the announcement.

"Molly, would you like to go to the party together?"

Her face brightens at once.

**Outcomes:**

- No additional game-state effects.

## Node: invite_emma

**Title:** A rather interesting proposal
**Emotion:** amused

{{ emmaInvitation }}

"And Antonio?" she adds as she turns to leave. "Do make an effort. I intend to look quite terrifying."

Somehow, you doubt it.

**Passages:**

### emmaInvitation

**When:** Antonio has the `emma_smitten` tag

You had a perfectly reasonable sentence prepared. It appears to have deserted you.

"I was wondering if you might... Saturday, that is... the party. With me. If you..."

Emma watches you with growing delight. "Fibonacci, are you inviting me to a party, or attempting to cast a spell without the necessary incantation?"

"The party. Definitely the party."

"How fortunate. I was beginning to worry about your health." She smiles. "Yes, Antonio. I'd be delighted."

**When:** Story tag `emma_ballet_shared_evening` is present

"Would you care to go together?" you ask.

Emma's smile turns mischievous. "Another evening of dancing, Antonio? After our last ball, I'm beginning to suspect you've developed a taste for it."

"Would that be a problem?"

"Not in the slightest. But I shall expect you to remember at least some of the steps." She gives you a warm smile. "I'd love to."

**When:** Story tag `emma_trusted_companion` is present

"Would you like to go together?"

For once, Emma doesn't seem interested in making you work for an answer. "Yes," she says, smiling. "I was hoping you'd ask."

She seems to realize how readily she's admitted it, and adds, "After all, someone must ensure you don't arrive dressed as an unconvincing turnip."

**Otherwise:**

"Would you like to go together?" you ask.

Emma considers you for a moment. "A whole evening without studying, competing, or arguing about card mechanics? How very irresponsible of you, Fibonacci."

"Is that a yes?"

"Of course it is." Her mouth curves into a smile. "I wouldn't miss the opportunity to see what you consider a suitable costume."

### Option A: Look forward to Saturday

**Text:**

You agree to meet Emma at the cafeteria entrance. She departs with a quick wave, leaving you to contemplate the considerable challenge of finding a costume that won't invite an entire evening of criticism.

An impossible task, perhaps. But not an unpleasant one.

**Outcomes:**

- Add story tag `halloween_with_emma`.
- Schedule `academy_halloween_party` for next Saturday evening at the cafeteria.

## Node: invite_molly

**Title:** A delighted acceptance
**Emotion:** happy

"Oh! Yes, absolutely!" Molly answers, rather more loudly than she intended. She glances around and laughs. "Sorry. I was just hoping I'd have someone to go with."

"Have you decided on a costume?"

"I've got an idea." She grins, suddenly looking rather pleased with herself. "But I'm not telling you. It's a surprise."

"Should I be frightened?"

"Terribly," she says, in a voice so cheerful that the threat loses most of its force.

She gathers her things, then turns back. "And Antonio? I'm really glad you asked."

### Option A: Agree to meet her there

**Text:**

You promise to meet Molly at the cafeteria entrance. She hurries away, already discussing costume ideas with another student.

You have the distinct impression she's going to enjoy this evening enormously. You find yourself looking forward to it too.

**Outcomes:**

- Add story tag `halloween_with_molly`.
- Schedule `academy_halloween_party` for next Saturday evening at the cafeteria.
