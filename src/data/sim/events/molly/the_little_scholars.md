Event: The Little Scholars

Event ID: the_little_scholars
Trigger: molly KnownTraits 1, emma KnownTraits 1, evening
Emotion: happy
Image: large

Text

As you go back to your room, you pass through the library. It is settling into its evening silence, except for one table that seems determined to resist the process. Three children are gathered around a young woman with kind eyes and a rather tired smile. One is struggling with a page of arithmetic, another is constructing a tower out of books, and the third is earnestly explaining why his homework was eaten by a goat.

"Well, that is unfortunate," the young woman says, apparently taking the goat's involvement quite seriously. She looks up as you approach. "Oh, hello Anotnio! I'm Molly, you remember? Are we being too loud? We can move somewhere else."

You assure her that you aren't here to complain. Relieved, she explains that the children come from families in the nearby village, and that she helps them with their lessons in the evenings. "Some of them can't afford proper schooling. It's only a little thing, really." She glances at the growing tower of books. "Though it's becoming rather more than a little thing. I have my own studies to keep up with, and there are more children coming every week."

The tower collapses with a magnificent thud. Molly closes her eyes for a moment, then patiently begins gathering the books.

"I've been thinking I should find someone to help. A fellow student, perhaps. I'd pay them, of course. It wouldn't be fair otherwise." She smiles at you. "You wouldn't happen to know anyone who might be interested?"

Effects

Move player and molly to library

new story tag: molly_tutoring

- Add chat topic `academy_lore_molly_tutoring` (lore; exclude molly; use once): "Molly Moreno holds lessons for village children in the library," your companion says. "Evenings, when the place has otherwise gone quiet. Arithmetic, a tower of books, and a goat that may have eaten someone's homework." A small smile. "She calls it a little thing. It does not look little."
- Add chat topic `molly_memory_library_goat` (memory; known by molly): "A goat ate the homework," Molly says, entirely serious. "That's what one of the children told me, and I believed him. It seemed possible." You mention the tower of books. "Oh, that was wonderful until it fell down. They were so proud of it." She smiles. "I don't mind picking the books up. They were having such a good time."

new molly knownTrait: Molly volunteers to tutor children from poor families in the nearby village. She is kind, patient, and increasingly overwhelmed by the work.

Options

Option A: Offer your services

Text:

"Well, I could help," you suggest.

Molly brightens immediately. "Really? Oh, that would be wonderful! Are you good with children?"

Before you can answer, the smallest boy looks you up and down. "Do you know your multiplication tables?"

An interview. Already.

Molly gives you an apologetic smile. "They're very thorough."

Outcomes:

Molly friendship +1

new job: Library Mentoring

new story tag: molly_tutor_partner

- Add chat topic `molly_memory_tutor_interview` (memory; known by molly): "Do you know your multiplication tables?" Molly says, and then covers a laugh. "I'm sorry. They asked you before I could stop them. They're very thorough." You say you offered to help anyway. "You did. I still get happy when I remember that." She ducks her head. "It's nice, not doing all of it alone."

Option B: Suggest Emma Delamain

Text:

"Actually, I know someone who might be perfect. Emma Delamain. She's brilliant, very serious about her studies, and I think she'd make an excellent teacher. Just, err... Don't tell her I said that."

"Emma Delamain?" Molly repeats thoughtfully. "I don't think we've met. Do you think she'd be interested?"

You admit that you haven't asked her.

"Well, perhaps I could speak to her sometime." Molly smiles. "Thank you, Antonio. That's very kind of you."

From beneath the table, a small voice announces that the goat has eaten another assignment.

Outcomes:

Molly friendship +1

- Add chat topic `molly_memory_emma_referral` (memory; known by molly): "I haven't told Emma," Molly says, lowering her voice as if Emma might hear anyway. "You said she was brilliant and would make a wonderful teacher, and then you asked me not to repeat it." She looks guilty and pleased at the same time. "I would like to ask her, though. If she says no, I'll still be glad you thought of her."

Option C: Wish her luck

Text:

"It sounds like a wonderful thing you're doing. I hope you find someone to help."

"Thank you." Molly's smile is warm, if a little weary. "They're good children, really. Even when they aren't being especially good."

One of the children proudly presents her with a drawing of a dragon. It has six legs, three heads, and what appears to be a very large moustache.

"Oh, that's lovely!" she says, with complete sincerity.

Outcomes:

Molly friendship +1

- Add chat topic `molly_memory_dragon_moustache` (memory; known by molly): "I kept the drawing," Molly says. "Six legs, three heads, and a moustache. A very large one." You ask whether she truly liked it. "Of course I did. Someone made it for me." Her smile softens. "You hoped I would find help. I'm managing. The children make it very hard to stop."
