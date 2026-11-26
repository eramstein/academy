# Event: The Art of Conversation

**Event ID:** `ousmane_art_of_conversation`  
**Trigger:** Day ≥ 4, afternoon.  
**Invitation:** Ousmane waves you over with a mischievous smile. He seems to have something to teach you.
**Place:** academy_courtyard
** Image ** large

## Text

You find Ousmane leaning against a column in the courtyard, looking immensely pleased with himself. As you approach, he exchanges a few words with a passing student, compliments her unusual hat, and sends her on her way laughing.

"Antonio, my young friend! Did you see that? A smile, freely given. Not even five seconds of effort."

You congratulate him on this remarkable achievement.

"Ah, but you miss the point! Conversation is an art. A little confidence, a little charm, and a genuine interest in the person before you. These are skills, Antonio, and skills can be learned!" He gives you an appraising look. "And I believe you could benefit from some instruction."

Before you can defend your conversational abilities, Ousmane spots Emma sitting on a nearby bench, arranging cards in neat little piles.

"Ah! An excellent opportunity for practice."

{{emmaSmitten}}

You eye him suspiciously. Ousmane has the expression of a general who has just discovered a particularly expendable volunteer.

He claps a hand on your shoulder. "Go on, then. Say something charming. I'll observe and provide constructive criticism."

Unfortunately, Emma has already noticed the two of you looking at her.

"Good afternoon, gentlemen," she calls. "Is there a reason you're staring at me like two conspirators who have forgotten what they're conspiring about?"

Ousmane beams. "Emma! How fortunate. Antonio was just about to demonstrate his conversational talents."

Emma looks from him to you. Her eyebrow rises.

"Oh, this should be interesting."

## Conditional passages

### emmaSmitten

**When:** Antonio has relation tag `emma_smitten`.

Your heart performs a small, entirely unnecessary maneuver. Ousmane notices, of course. The man's powers of observation are a terrible burden to his friends.

"Particularly excellent," he murmurs, grinning.

**Otherwise:**

You glance at Emma, then back at Ousmane. You begin to suspect this lesson has rather more to do with his amusement than your education.

## Options

### Option A: Take a genuine interest in Emma's work

**Text:**

You sit beside Emma and take a closer look at her cards.

"What are you working on?"

Emma gives you a slightly suspicious glance, as if she had expected a considerably more ridiculous opening.

"A new deck. I'm trying to solve a problem with its early-game consistency." She picks up two cards and shows you the interaction she's been studying.

You ask a few questions, and before long the two of you are discussing possible improvements.

Ousmane watches for a moment, then clears his throat.

"Well, I suppose that counts as a successful conversation."

"Does it?" Emma asks, looking up. "How disappointing for you. I imagine you were hoping for something more entertaining."

Ousmane sighs theatrically. "My finest student, and already he has surpassed his teacher."

"Your finest student?" Emma replies. "How many do you have?"

"One."

"An impressive selection process."

**Outcomes:**

- Emma friendship +1.
- Ousmane friendship +1.

### Option B: Attempt a dazzling compliment

**Check:** Charisma — Medium.

**On success:**

You step forward with the confidence of a man who has absolutely no intention of embarrassing himself.

"Emma, I was just telling Ousmane that you're probably the most dangerous person at the Academy."

Emma tilts her head. "Dangerous?"

"Naturally. Intelligent, ambitious, terrifyingly competent. I imagine half the students are already planning to surrender."

She considers this for a moment, then smiles.

"Only half? I'm clearly not working hard enough."

Ousmane bursts into laughter.

"Magnificent! A compliment, a little humor, and a charming response! You see, Antonio? You're a natural!"

Emma folds her arms. "I wouldn't go that far. But I'll admit he has potential."

She gives you a mischievous look.

"With a sufficiently patient teacher, perhaps."

**Outcomes on success:**

- Emma rivalry +1.
- Ousmane respect +1.

**On failure:**

You decide to follow Ousmane's advice. Confidence. Charm. A genuine compliment.

Unfortunately, somewhere between deciding to speak and opening your mouth, your vocabulary abandons you.

"Emma, I just wanted to say that you're... remarkably..."

She waits patiently.

"...remarkable."

There is a short silence.

"Thank you, Antonio," she says solemnly. "I shall treasure that observation."

Behind you, Ousmane makes a noise like a man desperately trying to swallow a laugh.

Emma takes pity on you. Or perhaps she merely wishes to prolong the entertainment.

"Take heart. I have heard considerably worse compliments."

"Really?"

"Certainly. Though not many."

**Outcomes on failure:**

- Ousmane friendship +1.
- Add memory `ousmane_memory_remarkable_compliment`, known by Ousmane: Ousmane greets you with a broad grin. "Antonio! I was thinking of your remarkable conversational abilities. Truly remarkable. One might even call them..." He pauses dramatically. "...remarkable." You inform him that the joke is getting old. "Nonsense! A great compliment never loses its charm."

### Option C: Turn the tables on Ousmane

**Text:**

You turn toward Emma with a perfectly innocent expression.

"Actually, Emma, Ousmane has been giving me lessons in the art of charming women. He claims to be something of an expert."

Emma's expression changes immediately. You recognize that smile. It usually means somebody is about to regret something.

"Does he indeed?"

Ousmane gives you a reproachful look. "Antonio, my friend, a gentleman does not reveal the secrets of his education."

"But surely," Emma continues, "an expert should be happy to demonstrate his methods?"

"Naturally!" Ousmane straightens his jacket. "There is nothing more satisfying than witnessing a student's enthusiasm for learning."

"Splendid. Then let's begin with a simple question. How many of your students have successfully charmed a woman?"

Ousmane hesitates.

"Well, Antonio is my first pupil."

Emma nods thoughtfully.

"So your method has a success rate of zero percent."

"Now, that is hardly a fair—"

"And you've been teaching it for how long?"

Ousmane throws up his hands. "Antonio! You were supposed to be learning from me, not conspiring with the examiner!"

Emma laughs. "Oh, I think he's learned something valuable."

You smile at your defeated instructor.

"Never underestimate the importance of choosing your allies."

Ousmane studies you for a moment, then breaks into a hearty laugh.

"Ha! Perhaps there is hope for you yet, little brother!"

**Outcomes:**

- Ousmane friendship +1.
- Emma rivalry +1.
- Add story tag `ousmane_flirting_exam`.
- Add memory `ousmane_memory_flirting_exam`, known by Ousmane and Emma: Ousmane gives you a suspicious look. "I hope you haven't been arranging any more examinations with Emma behind my back." You assure him that your educational ambitions remain entirely innocent. "Good. Because next time, my young friend, I shall be the one asking the questions." His expression suggests that he has already started preparing them.
