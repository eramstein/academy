# Event: The Falkenheim Tournament

**NPC:** emma  
**Event ID:** `emma_falkenheim_tournament`  
**Trigger:** Tournament is scheduled and Antonio is eligible to participate  
**Emotion:** neutral

## Text

Falkenheim School greets you with polished marble, towering statues, and the sort of silence that makes you reluctant to breathe too loudly. Apparently, wealth can buy almost everything except a welcoming atmosphere.

The school's director offers a stiff greeting to your delegation. Beside him stands Franz Falkenstein, Elsa's older brother and Falkenheim's team captain: handsome, impeccably dressed, and evidently aware of both facts. His second, Olga Saratovskaya, is a tall, pale young woman with almost white-blond hair and icy blue eyes. She surveys you with the faint, cruel interest of someone inspecting a particularly disappointing specimen.

Emma draws Franz for the opening round. You draw Olga.

"Try not to look so frightened, Antonio," Emma murmurs. "I'm sure she doesn't actually eat her opponents. And do stop glaring at Franz. He's not _that_ handsome."

## Options

### Option A: Face Olga

**Next:** after-match-1

**Match:** Olga Saratovskaya

**Text:**

Olga takes her seat without a greeting, arranges her cards with surgical precision, and fixes you with a chilly stare. You shuffle your deck and try to look like someone who has never been intimidated in his life.

**Outcomes:**

- No additional game-state effects.

## Node: after-match-1

**Title:** First round results  
**Emotion:** neutral

**Passages:**

antonioResult

When: antonio_won

Olga studies the final board in silence. "Unexpected," she says at last, as though you've committed a minor breach of etiquette by winning.

Otherwise:

Olga claims the final point with barely a change of expression. "Thank you," she says, in a tone suggesting you have just completed a useful laboratory experiment.

emmaResult

When: emma_tourney_emma_prepared

At the neighboring table, Emma defeats Franz. He demands another look at the final play; Emma obligingly points to the cards, one by one, with infuriating patience.

Otherwise:

At the neighboring table, Franz defeats Emma. His smile is insufferable. Emma congratulates him with impeccable courtesy, although the way she gathers her cards suggests she is already planning their next encounter.

teamResult

When: emma_tourney_flawless_victory

Two victories. Falkenheim's director looks as though someone has served vinegar in his finest crystal. Franz mutters something about luck.

"How reassuring," Emma says sweetly. "After your director's letter, I was beginning to think our Academy had become hopelessly obsolete. Apparently not quite yet." You exchange a grin.

When: emma_tourney_devastating_loss

Falkenheim takes both matches. Franz accepts the applause as his natural due, while the director looks positively restored to health.

Emma exhales. "Well. I had hoped to disprove his charming letter today." She glances at you. "We'll have to settle for making him nervous next time."

Otherwise:

One victory each. The director announces a deciding match, sounding faintly offended that the matter requires further discussion. Emma catches your eye; neither of you is ready to concede anything.

finalistResult

When: emma_tourney_tiebreaker and emma_tourney_finalist_antonio

Franz will be your opponent. Emma leans closer. "Do try to spoil his afternoon, Antonio. I suspect it would do wonders for his character."

When: emma_tourney_tiebreaker and emma_tourney_finalist_emma

Emma will face Olga. She gives you a quick, confident smile. "My turn. Try not to look more nervous than I am."

Otherwise:

The final scores are recorded, and the hall begins to empty.

**On enter:**

When: emma_tourney_emma_prepared and antonio_won

- Add story tag emma_tourney_flawless_victory

When: emma_tourney_emma_prepared and antonio_lost

- Add story tag emma_tourney_tiebreaker

When: not emma_tourney_emma_prepared and antonio_won

- Add story tag emma_tourney_tiebreaker

When: not emma_tourney_emma_prepared and antonio_lost

- Add story tag emma_tourney_devastating_loss

{{ antonioResult }}

{{ emmaResult }}

{{ teamResult }}

{{ finalistResult }}

The officials collect the score sheets.

### Option A: Return to the Academy — Victory

**Only if:** emma_tourney_flawless_victory

**Text:**

You leave Falkenheim with the trophy and a memory of its director's expression that should sustain you for weeks.

**Outcomes:**

- Follow up event `emma_return_win`.

### Option B: Return to the Academy — Defeat

**Only if:** emma_tourney_devastating_loss

**Text:**

You leave Falkenheim empty-handed. Emma walks beside you, unusually quiet, until she remarks, "Next time, we should bring a trophy. Apparently they keep theirs here."

**Outcomes:**

- Follow up event `emma_return_lost`.

### Option C: Face Franz in the final

**Only if:** emma_tourney_tiebreaker and emma_tourney_finalist_antonio

**Next:** after-match-2

**Match:** Franz Falkenstein

**Text:**

Franz sits opposite you, smiling with rather too many teeth. "I trust you'll provide a better challenge than expected." You straighten your cards. You'd hate to disappoint him.

**Outcomes:**

- No additional game-state effects.

### Option D: Watch Emma's final

**Only if:** emma_tourney_tiebreaker and emma_tourney_finalist_emma

**Next:** emma-triumphant

**Text:**

Emma sits opposite Olga, perfectly composed. As she passes you, she whispers, "If I win, you may applaud. Modestly."

**Outcomes:**

- No additional game-state effects.

## Node: after-match-2

**Title:** The final result  
**Emotion:** neutral

**Passages:**

finalResult

When: antonio_won

Your final play defeats Franz. He stares at the table, then begins explaining why the result proves nothing. The director's expression is even more rewarding.

Emma steps beside you. "Antonio, I believe we've just demonstrated that our supposedly antiquated Academy still has a few tricks left." She turns to Franz with a gracious smile. "Thank you for hosting us. Most educational."

Otherwise:

Franz wins the deciding match and rises to accept the applause with the air of a man receiving his rightful inheritance. You can practically hear Elsa boasting about it already.

Emma joins you. "Never mind, Antonio. He was good." She pauses. "I do wish he weren't quite so pleased about it."

{{ finalResult }}

### Option A: Return to the Academy — Victory

**Only if:** last match was won

**Text:**

You leave Falkenheim behind and begin the journey home.

**Outcomes:**

- Follow up event `emma_return_win`.

### Option B: Return to the Academy — Defeat

**Only if:** last match was lost

**Text:**

You leave Falkenheim behind and begin the journey home.

**Outcomes:**

- Follow up event `emma_return_lost`.

## Node: emma-triumphant

**Title:** Emma's triumph  
**Emotion:** proud

Emma wins the deciding match. Olga's pale eyes narrow; across the room, Franz looks personally insulted by the result. The director offers congratulations through clenched teeth.

"How kind," Emma replies brightly. "We were so worried, after your letter, that our little Academy might no longer be competitive. What a relief!"

She turns to you with a triumphant smile. "Well, Antonio? Was my applause suitably modest?"

### Option A: Return to the Academy

**Text:**

You and Emma begin the journey home, leaving Falkenheim to contemplate its hospitality and its defeat.

**Outcomes:**

- Follow up event `emma_return_win`.
