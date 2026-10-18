export enum DayPeriod {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export enum EventEffectType {
  GetDeck = 'get_deck',
  Subscribe = 'subscribe',
  AddResource = 'add_resource',
  AddGold = 'add_gold',
  ScheduleActivity = 'schedule_activity',
  GetJob = 'get_job',
  FollowUpEvent = 'follow_up_event',
  OfferCardGifts = 'offer_card_gifts',
  GiftCardToCharacter = 'gift_card_to_character',
  TeachColor = 'teach_color',
  TeachAbility = 'teach_ability',
  Narrate = 'narrate',
  LevelAttribute = 'level_attribute',
  LevelUpCharacter = 'level_up_character',
  ChangeRelation = 'change_relation',
  UpdateRelationArc = 'update_relation_arc',
  AddRelationTag = 'add_relation_tag',
  AddStoryTag = 'add_story_tag',
  AddKnownTrait = 'add_known_trait',
  Move = 'move',
  UseFocus = 'use_focus',
  /** Start a battle; pair with `nextNode` to resume the event after the match. */
  StartMatch = 'start_match',
  NewLeagueSeason = 'new_league_season',
  AddPossession = 'add_possession',
}

export enum ActionType {
  PerformJob = 'perform_job',
  Invoke = 'invoke',
  Conjure = 'conjure',
  Augment = 'augment',
  Distill = 'distill',
  Move = 'move',
  Transaction = 'transaction',
  Negotiate = 'negotiate',
  Wait = 'wait',
  Socialize = 'socialize',
  StartMatch = 'start_match',
  StudyColors = 'study_colors',
  StudyAbilities = 'study_abilities',
  Romance = 'romance',
  Invite = 'invite',
}

export enum NarrationType {
  Text = 'text',
  AttributeCheck = 'attribute_check',
  ConjuredCard = 'conjured_card',
  EncantedCard = 'encanted_card',
  GiftCardChoice = 'gift_card_choice',
  NewPeriod = 'new_period',
  MatchResult = 'match_result',
  Transaction = 'transaction',
  JobResult = 'job_result',
  RelationUpdate = 'relation_update',
}

export enum ActivityType {
  Class = 'class',
  Work = 'work',
  Social = 'social',
  Date = 'date',
  Training = 'training',
  Study = 'study',
  Romance = 'romance',
  Tournament = 'tournament',
  Exam = 'exam',
  Event = 'event',
  Adventure = 'adventure',
  LeagueCeremony = 'league_ceremony',
}

export enum ClassType {
  Artificery = 'artificery',
  Enchanting = 'enchanting',
}

export enum SubscriptionType {
  Academy = 'academy',
  Library = 'library',
  Inn = 'inn',
  MaterialShop = 'material_shop',
}

export enum CharacterTrait {
  Grumpy = 'grumpy',
  Friendly = 'friendly',
  Funny = 'funny',
  Beautiful = 'beautiful',
  Shy = 'shy',
  Confident = 'confident',
  Assertive = 'assertive',
  Abrasive = 'abrasive',
  Arrogant = 'arrogant',
  Antagonistic = 'antagonistic',
  Cruel = 'cruel',
}

export enum CharacterGender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum SchoolName {
  Academy = 'academy',
  Falkenheim = 'falkenheim',
}

export enum EventTriggerType {
  Day = 'day',
  Period = 'period',
  ActivityType = 'activity_type',
  Place = 'place',
  CharacterPresent = 'character_present',
  RelationParameter = 'relation_parameter',
  Socialize = 'socialize',
  ActivityHistory = 'activity_history',
  DayOfWeek = 'day_of_week',
  ScheduledActivity = 'scheduled_activity',
  MatchesWon = 'matches_won',
  MatchesLost = 'matches_lost',
  LeaguesWon = 'leagues_won',
  StoryTag = 'story_tag',
  /** NPC has (or lacks) a `RelationTag` on `relationTags`. */
  RelationTag = 'relation_tag',
  /** NPC has at least `count` entries in `knownTraits`. */
  KnownTraits = 'known_traits',
  /** Most recent finished match was a win (`gs.scene.lastMatchWon === true`). */
  LastMatchWon = 'last_match_won',
  /** Most recent finished match was a loss (`gs.scene.lastMatchWon === false`). */
  LastMatchLost = 'last_match_lost',
}

export enum ResourceType {
  // Common resources
  MagicDust = 'magic_dust',
  Mithril = 'mithril',
  Moxes = 'moxes',
  // Unique resources
  MollysBeads = 'mollys_beads',
  SchlupakMushrooms = 'schlupak_mushrooms',
}

export enum JobType {
  Mentoring = 'mentoring',
  Coaching = 'coaching',
}

export enum Emotion {
  Neutral = 'neutral',
  Happy = 'happy',
  Laughing = 'laughing',
  Sad = 'sad',
  Angry = 'angry',
  Surprised = 'surprised',
  Flirtatious = 'flirtatious',
  Taunting = 'taunting',
  Dreaming = 'dreaming',
  Proud = 'proud',
  Embarrassed = 'embarrassed',
  Scared = 'scared',
  Amused = 'amused',
  Disappointed = 'disappointed',
  Excited = 'excited',
  Disgusted = 'disgusted',
}

export enum RelationTag {
  // general tags
  Teammate = 'teammate',
  Rival = 'rival',
  Friend = 'friend',
  Lover = 'lover',
  SignificantOther = 'significant_other',
  // NPC specific tags
  EmmaSmitten = "You are under Emma's spell",
}

export enum PossessionType {
  Clothing = 'clothing',
}
