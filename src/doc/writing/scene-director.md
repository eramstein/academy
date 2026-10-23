# High Level Structure

The scene director handles how information about the world get fed to the player via small social interactions with NPCs. Its role is to select which "ChatTopic" (small convesration with a NPC) is the most interesting in the current context. The list of available topics is defined by simulation logic and based on the current gameState (gs). The prose of these stories is pre-written as a JSON file as "ChatTopicTexts". These ChatTopicTexts can be generic (can be used for any character at any location) or more specific (e.g. "how Emma would mention that").

It has 2 goals:

- from a gameplay perspective: pass useful info to the player
- from an immersion perspective: make to world and characters feel alive and connected

## Topics management

### Topic definition

A topic references a piece of information that is currently available in the world. The simulation starts with initial base topics, and new ones are created as the playthrough progresses, via events or other means. When a topic is used in a conversation, we either delete it or track its usage too avoid repetition.

Topics can be:

- Lore: news/gossip/info. This is information for the player. Can be used to get background info about NPCs, about the academy and world in general, or news about what chacarters are doing "off screen", e.g. if we skipped a event we get to know what happened.
- Memories: some shared memory the NPC can use for flavor, running jokes, etc...
- NPC routine: info about routine activities of a NPC. These routines are actual NPC schedules.
- Evergreen conversation: fall back when no other option is relevant. Usually small talk, can be used for NPCs to give background info about themselves or showcase their personality.

Note that a topic doesn't contain the test of the conversation itself, it is "meatadata".

### Topic creation

The sim starts with a set of pre-existing ChatTopics and ChatTopicTexts:

- general world lore
- general academy lore
- private lore for each NPC (these will be known only by them), e.g. emma_lore_private
- public lore for each NPC (the NPC itself will be excluded)

Then they are added at runtime, we create associated topic and texts when:

- a new NPC routine is defined
- as event effects: create memory or create lore topics. Memories are by default only for the event's NPCs

More can be added later (e.g. TCG matches results...).

### Topic selection

When a player initiates a chat with an NPC (via the Socialize action), the scene director selects a topic from the list of available ones in the current game state.

First, it has to filter which ones are known by this NPC.
Filter out
Then, it links the topics with the ChatTopicTexts data to check is that NPC has dedicated ChatTopicText.

Then, it ranks them. Each factors adds points, the highest comes out (random selection if tied). We need to have these weights configuration easy to change.

- Topic types: evergreen counts for less then the other types
- NPC specific text exists: grants some points
- Topic already mentionned: lose points, the more the closest it is to today
- Recently created topics (`usage.generatedOnDay`): gain points that decay each day (seed catalog topics use day 0 and get no boost)
- Author `usage.priority` (0–3): each step adds a fixed boost so important callbacks can compete with fresher gossip

## Resolving a topic into a conversation scene

Once the topic is selected, the scene director looks up ChatTopicTexts data. Each topic can have several variants there, we pick one with a ranking system:

- if the NPC has a specific text, only use these
- then, if there is a specified activity type or location, use these in priority
- if several candidates are left, use the one which wasn't used yet (or the further back in time if all were used), else random selection

This text is then used to be displayed in the UI Scene. We keep track that the topic was used at this day, with which text.
