The scene director handles how information about the world get fed to the player via events or small social interactions with NPCs.

The scene director feature is handled by our simulatio nengine and current game state, and acts as a narrative director: it defines what happens (how the NPC shoudl react, situation, what info to return to the player). The LLM then only acts as a writer, for flavor purposes. It puts the commands from the scene director into prose.

# High Level Structure

The trigger for the scene director can be either:

- initiated by the player, via a Socialize action
- hints from NPCs if they have something important to say, displayed as buttons in the scene actions

This leads to a small social scene with that NPC. The content, tone, positive/negative reaction of the NPC and outcome is defined by the scene director. The writing itself is handlded by the LLM service.

The purpose of a social scene aim at either giving useful info to the player, develop a NPC, or just have a fun / flavor ful scene.

## Inputs: what goes into a LLM prompt context

### World information

The scene director must pass one of these info as context to the LLM, so that the conversation feels connected to the world and past events. The LLM is asked to use it in the text it writes.

- Rumors: news/gossip. From gs.rumors, filtered based on day, and fromNpcKey. This is information for the player. Once a rumor is used, it gets deleted.
- Memories: some shared memory the NPC can use for flavor, running jokes, etc... When used, referenceCount and lastReferencedDay are updated to avoid repetition.
- NPC routine: info about routine activities of a NPC. isKnown is updated when used, to avoid repeating it.

### Flavor

NPC info is always passed:

- speechExamples (typical lines in character)
- humor type
- personality traits
- current relation tags

Then we randomly add a activity based on activity type and an environment based on the location. This is picked from arrays by activity type and place. See locationSituations and activitySituations as examples in scene-director.ts

And we select a interaction dynamic and emotional tone, based on NPC preferences, interaction type, and interaction success/failure. See responseDynamics in scene-director.ts and NPCs personality.preferredResponseDynamics (these are for weighted probability)

## Outputs: what information is given

If the prompt is properly constructed, the LLM should write a text giving the player either useful information (NPC habits, preferences, quest hints...), lore about a NPC (their past, gossip, info about how missed/skipped events turned out...), or a fun scene.
