# Interactions System

The interactions system uses a LLM to simulation back and forther social interactions between the player and a NPC: an argument, an evening at the pub... It should be an alternative as one of the Socialize action sub types (like chat or hangout).

It includes some state, structure and is not free text.

We'll use an argument between the characters as an example. The implementation should be generic and data driven so that we can do many other types of interactions without writing code, just providing a different configuration.

Initial setup contains:

- a system prompt explaining to the LLM what it has to do
- the initial situation. For example, "Antoine (the player) and Ousmane are sitting at a table at the cafeteria, they argue about a football match."
- a list of possible action types the user can take. For example ["argue in a friendly way", "argue aggressively"]
- an initial list of quantitative values, with potential outcomes if they reach a given level, e.g. [{ key: "npc_annoyance", label: "How annoyed the NPC is", outcomes: [{ threshold: ">10", effect: "angry outburst" }, { threshold: "< -3", effect: "reconciliation" }] }] . Each value has a textual description, e.g. { 0: neutral, 5: annoyed, 9: extremely annoyed }
- an initial list of how the NPC would react to each action type (how it would update the quantitative values), e.g. [{ "argue in a friendly way": { "npc_annoyance": -1}, "argue aggressively": {"npc_annoyance": 1} }]

Then we call the LLM, passing this info:

- system prompt
- current situation (initial one first, then a rolling window of up to the last 3 updates)
- character chosen action (for the first call there is none)
- current state of the quantitative values (as text) describing the emotional state of the characters

The LLM replies with:

- scene description: prose describing what the player did and how the NPC reacted. e.g. player choses action "blame referee", the LLM writes "Antoine says it was all the referee's fault. It makes Ousmane furious and he slams the table."
- quantitative values changes, new values for each e.g. [{npc_annoyance: 8}]
- possible follow up player actions, at least one for each action type, more for the most plausible ones according to the LLM. These are in short free text form (to be displayed as action buttons), but should be specific, not just the action type rephrased. They should also include how chosing each action would affect the quantitative values. e.g. [ { type: "argue in a friendly way", text: "Explain why the referee was wrong" , updates: {"npc_annoyance": -1, "player_annoyance": 1 }}, { type: "argue aggressively", text: "Say Ousmane doesn't know anything about football", updates: {"npc_annoyance": -1, "player_annoyance": 1 } }]

Present the player with the options, plus one saying "Stop there", and then call the LLM back.
