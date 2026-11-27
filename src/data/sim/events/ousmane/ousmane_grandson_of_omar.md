# Event: The Grandson of Omar

**Event ID:** `ousmane_grandson_of_omar`

**Trigger:** Day ≥ 12, Ousmane friendship ≥ 2, afternoon or evening.

**Location:** Library

**Invitation:** Ousmane is studying an enormous old artificery treatise, looking unusually serious.

** Emotion ** Disappointed

## Text

You find Ousmane at a library table, surrounded by books, diagrams, and several sheets of calculations. This is unusual enough. Even more unusual is the expression on his face: a deep frown, entirely devoid of his customary good humor.

"Antonio! Just the man I needed." He gestures toward an open book. "Tell me, what do you think of this?"

You examine an extraordinarily complicated diagram of an artificery mechanism. You recognize perhaps a third of its components. A generous estimate.

"It's a masterpiece," Ousmane explains. "An ingenious application of essence stabilization. Elegant, efficient, decades ahead of its time. And quite impossible to reproduce, apparently."

He shuts the book with an irritated sigh.

"The work of Omar Tempeli. My grandfather. Perhaps you've heard of him?"

You have indeed. Omar Tempeli is one of the great names in artifact crafting, and several of his designs are still taught at the Academy.

"Yes, well. Imagine having that man at family dinners. 'How are your studies, Ousmane? Invented anything revolutionary this week?'"

He laughs, but his smile doesn't quite reach his eyes.

"I've spent three days trying to understand how he achieved this particular result. Three days! And every time I think I've solved it, another problem appears. I'm beginning to suspect the old devil deliberately left out a few details."

He looks at the portrait of his grandfather printed inside the book.

"Sometimes I wonder whether I'll ever produce anything half as good."

## Effects

- Discover character trait for Ousmane: **Grandfather's Legacy** — Ousmane's grandfather Omar was a renowned master artificer. Ousmane admires him enormously but worries that he may never live up to his reputation.

## Options

### Option A: "Perhaps you should stop trying to be your grandfather."

**Text:**

Ousmane raises an eyebrow. "A bold suggestion. Shall I also stop being handsome? I have certain hereditary obligations, you know."

You point out that his grandfather became famous by inventing things, not by reproducing somebody else's work. Surely the best way to honor him would be to create something original?

Ousmane considers this for a moment, then slowly smiles.

"You know, little brother, for someone who occasionally struggles to find his own shoes, you have a remarkably good head on your shoulders."

He pulls a sheet of parchment from beneath the books.

"As it happens, I've been working on a little invention of my own. A brooch that enhances coordination and dexterity. Not revolutionary, perhaps, but it works rather well. Here, take the pattern. I'd be curious to see what you make of it."

He pauses, looking back at his grandfather's book.

"And perhaps I'll spend tomorrow working on my own designs for a change."

**Outcomes:**

- Ousmane friendship +1.
- Ousmane respect +1.
- Learn artifact pattern `dexterity-brooch`.
- Add story tag `ousmane_originality_encouraged`.

### Option B: "Let's see if we can solve it together."

**Text:**

"Ah! A fellow man of science!" Ousmane declares, immediately clearing a space for you. "Excellent. Two brilliant minds against one dead genius. The odds are improving."

You spend the next hour examining the diagrams together. Ousmane explains the more advanced principles, occasionally interrupting himself to complain about his grandfather's atrocious handwriting.

Eventually, you identify a clever arrangement of essence channels that neither of you had noticed before.

Ousmane stares at the diagram, then bursts into laughter.

"Of course! Of course! The cunning old fox!"

He claps you on the shoulder with enough enthusiasm to threaten your continued residence in the chair.

"Antonio, my friend, we make an excellent team. And I believe you've earned something for your trouble."

He produces several cards from his collection.

"Choose one. My own work, I assure you. Grandfather had the decency to leave these alone."

**Outcomes:**

- Ousmane friendship +1.
- Ousmane respect +1.
- Choose one card from 3 randomly selected cards from `ousmane,base`.
- Add story tag `ousmane_omar_research`.

### Option C: "Maybe your grandfather wasn't quite as perfect as everyone says."

**Text:**

Ousmane looks at you with an expression of theatrical outrage.

"Antonio! You insult the honor of my family! I ought to challenge you to a duel."

You suggest that perhaps Omar made mistakes, abandoned projects, or struggled for years with problems that now look simple in his published work.

Ousmane opens his mouth to protest, then hesitates.

"Well... he did once set fire to his own workshop. Twice, actually. My grandmother never let him forget it."

He chuckles, then grows thoughtful.

"You're right, of course. We remember the masterpieces, not the mountains of broken prototypes that came before them."

He closes the book, looking considerably more cheerful.

"Come, little brother. I've had enough of being humbled by a dead man for one day. Let's go find someone living to humiliate me instead. Preferably over a game of Hordes."

**Outcomes:**

- Ousmane friendship +2.
- Add story tag `ousmane_omar_humanized`.

## Follow-up memory

**After Option A — `ousmane_memory_originality`**, known by Ousmane:

Ousmane greets you with a grin. "I've been following your advice, Antonio. Working on my own inventions instead of trying to reproduce my grandfather's. Yesterday I created something entirely original." He pauses. "It exploded, naturally. But it was _my_ explosion, and I take considerable pride in that."

**After Option B — `ousmane_memory_omar_research`**, known by Ousmane:

"Remember that mechanism we deciphered together?" Ousmane asks. "I've been studying it further. Grandfather really was a genius, you know. Though I suspect he'd have been considerably less pleased to discover that two students solved his little puzzle in a single afternoon." He grins. "Fortunately, he's not in a position to complain."

**After Option C — `ousmane_memory_omar_humanized`**, known by Ousmane:

"You've ruined my grandfather's reputation, Antonio," Ousmane announces with mock severity. "Every time I read one of his treatises now, I imagine him accidentally setting fire to his trousers. It's becoming quite difficult to maintain the proper academic reverence."
