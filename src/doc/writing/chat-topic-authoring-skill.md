# Skill: Author initial Academy ChatTopicTexts

## When to use

Use this guide whenever asked to create, extend, edit, or review the game's **initial pre-authored chat-topic library** (world, Academy, NPC lore and routines). These are short conversations available when Antonio chats with an NPC. They are **display-ready text**, not memory summaries, LLM prompts, or instructions. This guide is for initial `ChatTopicText[]` JSON files; event-generated `add_chat_topic` effects follow the related conventions in `writing-bible.md`.

## Read before authoring

1. Read the existing target JSON and preserve its topic keys, variant structure, and established facts unless asked to revise them.
2. Read relevant canon sources: `world-building.md` for the world; `rpg-design.md` for gameplay and the Academy; the NPC profile (such as `emma.md`) for characterization; and `writing-bible.md` for voice and prose conventions.
3. Read `scene-director.md` for topic selection and reusable text behavior. If files disagree, do not invent an explanation: report the discrepancy and use the user's most recent explicit specification.
4. Treat user-confirmed new details as canon (e.g., Emma's pet rabbit), but do not treat illustrative/dummy text as new lore unless confirmed. Prefer canon-established facts; flag inventions for approval rather than silently establishing new people, institutions, schedules, or events.

## Output format

Create **valid UTF-8 JSON**, a top-level array of `ChatTopicText` objects, without comments or explanatory wrappers:

```ts
interface ChatTopicText {
  key?: string;          // optional unique identifier for a text variant
  topicKey: string;      // required, shared by variants of the same topic
  text: string;          // complete player-facing conversation, ready to display
  activityType?: ActivityType;
  placeKey?: string;
  npcKey?: string;       // specific speaker version; omit for speaker-neutral text
}
```

**Only output ChatTopicText values.** The game derives `ChatTopic` records and their access restrictions from topic keys; do not hand-author `ChatTopic` records in this file or add unsupported fields such as `type`, `knownByNpcKeys`, or `usage`.

## Topic key convention

Use `{subject}_{topicType}_{topicLabel}` with an optional `_private` suffix:

- `world_lore_captured-essence`: public lore, anyone can deliver it.
- `academy_lore_tuition`: public Academy lore.
- `emma_lore_work-ethic`: public lore about Emma; the derived ChatTopic excludes Emma herself.
- `emma_lore_childhood-pet_private`: private lore available only from Emma.
- `emma_routine_library`: information based on Emma's actual schedule; typically has both generic and Emma-specific text variants.

For a public topic about an NPC, the runtime exclusion of that NPC is a **topic-level access rule**. A specific text variant with `npcKey` is a **speaker-specific realization of the same topic**, not a new topic. Do not give different `topicKey`s to variants containing the same underlying fact. Keep identifiers stable across revisions, and avoid collisions with event-generated topics.

If an existing key is inconsistent with the convention, preserve it and note the issue instead of silently renaming it. Do not presume unconfirmed derivation behavior for other types such as memory or evergreen.

## Writing requirements

- **Actual mini-scenes:** Write a short conversation in second-person present tense, addressing Antonio as **you** when necessary. The text may contain narration and one or two lines of dialogue. Do not deliver only a fact, summary, or prompt.
- **Small, focused lore drops:** Each topic communicates one coherent idea, preferably through a character's observation, opinion, question, or witty comparison. Keep it natural rather than an encyclopedia lecture or a conspicuous lore dump.
- **Evergreen and portable:** Assume the conversation could occur on different days, in different locations, during different activities. Avoid words such as "today", "yesterday", "here", or requiring a table, book, third person, specific weather, or particular completed story event unless the topic is explicitly gated by runtime conditions.
- **Tone:** Warm, characterful, gently amusing; grounded in a low-fantasy, early-19th-century steampunk artificery Academy. Not every entry needs a punchline. Vary openings, sentence rhythms, and conversational devices.
- **Length:** Normally 35–85 words (roughly one compact paragraph), shorter if the point lands cleanly. The established source JSON may include shorter examples; do not pad them.
- **Continuity:** Do not reveal secret/private biographies to public speakers or present speculative rumors as firm fact. Never invent shared experiences with Antonio, player decisions, relationship milestones, TCG outcomes, or new gameplay rewards.
- **No mechanical consequences:** These scenes convey lore; they do not mutate state, make binding promises, or initiate quests unless those outcomes are independently supported by existing gameplay.

### Mandatory neutral-speaker convention: `your companion`

For **every speaker-neutral** entry (one without `npcKey`), refer to the currently speaking NPC in narration as **`your companion`**, exactly these lowercase words. This is a deliberate runtime placeholder that the game replaces with the current NPC's name.

**Good:**

```json
{
  "topicKey": "world_lore_captured-essence",
  "text": "\"The trick isn't the paper,\" your companion explains. \"It's persuading an essence to stay inside it. The paper merely has the good manners to hold still.\""
}
```

**Avoid:** `the student`, `someone`, `a friend`, `your classmate`, the generic `NPC`, or a made-up character name when referring to the current speaker. Do not use `your companion` for an unrelated person mentioned in the topic. Keep it in a syntactically replaceable position; e.g., `your companion says` will become `Emma Delamain says`. Avoid possessive or gendered pronoun chains that might not suit the substituted speaker. Don't force the placeholder into every sentence; use it when referring to the speaker in narration. Dialogue itself should not contain the placeholder as a form of address.

For **speaker-specific** entries (`npcKey: "emma"`, `npcKey: "elsa"`, etc.), write the character's name and distinctive voice directly. Don't use `your companion` to refer to that character in those variants.

## Public, private, and routine examples

```json
[
  {
    "topicKey": "world_lore_mature-aura",
    "text": "\"Ever wonder why so many first-years are already in their twenties?\" your companion asks. \"A magical aura needs time to mature. Apparently childhood is not quite long enough to prepare us for enchanted cardboard.\""
  },
  {
    "topicKey": "emma_lore_work-ethic",
    "text": "\"People call Emma talented,\" your companion remarks. \"They don't always notice how long she keeps working after everyone else has put their books away.\""
  },
  {
    "topicKey": "emma_lore_childhood-pet_private",
    "text": "\"I have a pet rabbit,\" Emma tells you. \"He's a discerning critic of my research. Most of my notes have escaped his attention, but not all of them.\"",
    "npcKey": "emma"
  },
  {
    "topicKey": "emma_routine_music",
    "text": "\"Emma plays violin at the Old Monk's Inn on Friday evenings,\" your companion says. \"Quite beautifully, too. It's the only time I've seen an entire common room voluntarily fall silent.\""
  },
  {
    "topicKey": "emma_routine_music",
    "npcKey": "emma",
    "text": "\"I play at the Old Monk's Inn on Friday evenings,\" Emma says. \"You're welcome to listen, provided you don't shout tactical advice between movements.\""
  }
]
```

The examples demonstrate format, not a request to duplicate topics that already exist. For routine entries, verify times and places against the actual schedule; don't invent or change routines. When asked to modify only routine dialogue, retain the existing two routine topics and change only their `text` values.

## Generation workflow

1. **Inventory:** List existing `topicKey`s, variants, and semantic coverage; deduplicate potential ideas.
2. **Select:** Prioritize foundational, broadly useful facts first (magic, four essences, artificery, the Academy, international traditions), then distinctive NPC details. For personal lore, separate public observations from private first-person disclosure.
3. **Write:** One complete exchange per entry; selectively add speaker-specific variants only where a recognizable perspective improves the scene. Keep neutral lore genuinely neutral about speaker identity.
4. **Canon audit:** Compare each statement with source documents, distinguish opinion from fact, and check secrecy, timing, and story progression.
5. **Portability audit:** Read each scene imagining it delivered by several eligible NPCs in different places and at different times. Check the exact `your companion` convention.
6. **Validation:** Parse the JSON, check all records have string `topicKey` and `text`, optional fields have appropriate types, and there are no accidental duplicate variants for the same topic plus `npcKey`/`placeKey`/`activityType` combination. Multiple variants with the same topic key are intentional when their speaker or other constraint differs; if adding unconstrained alternatives, give them stable unique `key`s if needed by the loader.
7. **Deliver:** Provide a downloadable `.json` file, summarize topic counts and subject categories, and call out any proposed lore that needs canon approval. Preserve other data when modifying an existing file unless the user requests a replacement.

## Quality bar

A good chat topic is understandable without the original prompt, true in any eligible playthrough, memorable enough to merit a click, and sounds like a person making conversation rather than a game encyclopedia. **Information is the topic; dialogue is the delivery.**
