# Event: Emma Finds Her Feet

**NPC:** emma  
**Event ID:** `emma_financial_independence_offscreen`  
**Trigger:** Term = 2; story tag `emma_financial_independance` is inferior to 8  
**Silent:** true

## Effects

- Add story tag `emma_financial_independance` +8.
- Invalidate event `emma_tuition_problem`.
- Invalidate event `emma_ball_invitation`.

- Add priority chat topic `emma_financial_success_molly` (lore, known by molly, use once):

  You find Molly in exceptionally high spirits. "Have you heard about Emma? She's finally sorted out all her money troubles!" She beams. "She's been getting paid for her artificery work, and apparently she's had some really good commissions. Enough that she doesn't have to worry about her tuition anymore!"

  Molly looks positively delighted.

  "I'm so happy for her. She's worked terribly hard, you know. And she was always worrying, even when she pretended she wasn't." She laughs. "I told her she ought to celebrate, but she said she'd rather put some money aside first. That's Emma for you!"

- Add priority chat topic `emma_financial_success_elsa` (lore, known by elsa, use once):

  Elsa is examining her nails when Emma's name comes up.

  "Oh, yes. I hear Miss Delamain has become quite the fashionable little artificer. Apparently some people are willing to pay remarkably good money for her creations."

  She gives a delicate shrug.

  "One must admire her industriousness, I suppose. Not everyone has the luxury of pursuing an education without worrying about the bills."

  You remark that Emma's success seems well deserved.

  "Naturally." Elsa smiles thinly. "Though I do hope she won't become insufferable about it. There is nothing quite so exhausting as someone who has recently discovered that she is successful."

  Coming from Elsa, this is a rather remarkable observation.

- Add priority chat topic `emma_financial_success_public` (lore, exclude emma, molly, elsa, use once):

  "Have you heard about Emma Delamain?" your companion asks. "Apparently she's been doing rather well for herself. A few patrons have taken an interest in her work, and she's been getting paid commissions for her cards."

  You ask whether she's still having trouble paying her tuition.

  "Not anymore, from what I hear. Word is she's earned enough to settle her debts and cover her studies. Quite impressive for a student, really."

  Your companion smiles.

  "I suppose that's what happens when you're both talented and determined enough to work twice as hard as everyone else."
