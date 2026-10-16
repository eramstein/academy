<!--
Shape reference for create-sim-event. Copy to src/data/sim/events/<npc>/<slug>.md
and replace the prose. Do not compile this file.

Markers the skill maps:
- Root beat is everything before the first ## Node.
- **Next:** on an option opens that node instead of ending the event.
- **Next:** under **On success:** / **On failure:** is that branch only.
- Omit **Next:** to end the event on that choice.
- **Only if:** gates that option. **Trigger:** on a node gates entering it.
  Both are judged when the choice is offered, before this beat's effects.
  Do not gate a node on a tag this same option or this node's **On enter:** adds.
- **Passages:** on a node uses the same When / Otherwise shape as ## Conditional passages.
- A node with no ### Option is narrated, then the event ends.
- Emotion must be an Emotion enum value (neutral, happy, sad, proud, …). Not "concerned".
-->

# Event: The Ledger

**NPC:** emma
**Event ID:** `example_multi_step`
**Trigger:** Emma is present, and emma_met has occurred
**Image:** example_multi_step.jpg large
**Emotion:** neutral

## Text

Emma is at the library table with a ledger open and one hand spread over the page.

{{ approach }}

She does not close it when she sees you.

## Conditional passages

approach

When: emma_met has occurred

"Antonio," she says. "You're early, or I'm late. Sit, if you mean to be useful."

Otherwise:

She looks up as if she has not decided whether you are a welcome interruption.

## Effects

- Add to Emma's known traits: **The tuition loan:** Her place at the Academy is paid for with borrowed money, and the repayment has come due sooner than she planned.

## Options

### Option A: Ask what the ledger is for

**Next:** the_sum

**Text:**

"What is all that?" you ask.

Emma's fingers tighten on the page. "A number," she says. "A rather impolite one."

**Outcomes:**

- No additional game-state effects.

### Option B: Leave her to it

**Text:**

You tell her you only came in for a book, and you take one without looking at the spine.

"Coward," she says, almost fondly, and goes back to her sums.

**Outcomes:**

- Emma friendship -1.

### Option C: Offer your savings

**Only if:** Emma friendship is at least 4

**Next:** the_offer

**Text:**

"I have a little put by," you say. "If the number isn't completely absurd."

**Outcomes:**

- Add story tag example_offered_savings.

## Node: the_sum

**Title:** The sum
**Image:** example_multi_step_sum.jpg medium
**Emotion:** sad
**Trigger:** emma_met has occurred

**On enter:**

- Add story tag example_heard_the_sum

**Passages:**

figure

When: Emma friendship is at least 2

She turns the ledger so you can read it.

Otherwise:

She names the figure without showing you the page.

She has been paying her tuition on a loan. The bank now wants the rest of it before the term is out.

{{ figure }}

"If I cannot find it," she says, "I leave."

### Option A: Read the clause yourself

**Check:** intelligence hard

**On success:**

**Next:** the_clause

**Text:**

You find the notice requirement in the margin, written as if the bank hoped no one would.

Emma reads it twice. "They can't call it in. Not yet."

**Outcomes:**

- Emma respect +2.
- Add story tag example_clause_found.

**On failure:**

**Next:** still_owing

**Text:**

You follow three clauses into a fourth, and the fourth wins. The bank may call the loan whenever it likes.

Emma closes the ledger. "Well. That was worth the evening, if only to be sure."

**Outcomes:**

- Emma respect +1.

### Option B: Tell her you will think of something

**Next:** still_owing

**Text:**

"Give me a day," you say.

"I have been giving myself days," she says. "They are not a currency the bank accepts."

She says it without heat. That is worse.

**Outcomes:**

- No additional game-state effects.

## Node: the_clause

**Title:** Not yet
**Emotion:** proud

She laughs once, short and startled, and then masters it.

"You magnificent creature. They have to honor the original schedule."

She squeezes your wrist and lets go, already reaching for paper.

### Option A: Ask her to celebrate

**Text:**

"The municipal tax code can wait," you say. "Come and eat something that isn't ink."

Emma considers the papers, then you. "One hour. And you are not allowed to call this a date where anyone can hear you."

**Outcomes:**

- Emma friendship +1.
- Emma love +1.

### Option B: Leave the victory where it is

**Text:**

You let her write the letter. When she looks up, you are still there, and that seems to be enough.

**Outcomes:**

- Emma respect +1.

## Node: still_owing

**Emotion:** disappointed

The sum does not change because you have seen it. Emma straightens the ledger, aligns the pen with the spine, and becomes polite again.

"Thank you for looking," she says. "I will find another way. I always do."

## Node: the_offer

**Title:** Not your debt
**Emotion:** embarrassed
**Trigger:** Emma friendship is at least 4

She stares at you as if you have offered to carry the library out the door.

"Absolutely not. You worked for your place here too."

She presses your hand, once, and takes hers back.

"Ask me something I can actually accept."

### Option A: Ask her to let you keep looking

**Next:** the_sum

**Text:**

"Then don't take the money," you say. "Let me read the agreement. I'm harder to insult than a bank."

A corner of her mouth moves. "That is a low standard, Fibonacci. Sit down."

**Outcomes:**

- No additional game-state effects.

### Option B: Drop it

**Text:**

You let the offer die. She is grateful, and she is also finished talking about it.

**Outcomes:**

- Emma friendship +1.
