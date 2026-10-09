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
  UnlockEvent = 'unlock_event',
  OfferCardGifts = 'offer_card_gifts',
  TeachColor = 'teach_color',
  TeachAbility = 'teach_ability',
  Narrate = 'narrate',
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
}

export enum ClassType {
  Artificery = 'artificery',
  Enchanting = 'enchanting',
}

export enum SubscriptionType {
  Academy = 'academy',
  Library = 'library',
  Inn = 'inn',
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
}

export enum CharacterGender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum SchoolName {
  Academy = 'academy',
  Kartekar = 'kartekar',
}

export enum EventTriggerType {
  PreviousEvents = 'previous_events',
  Day = 'day',
  Period = 'period',
  ActivityType = 'activity_type',
  Place = 'place',
  CharacterPresent = 'character_present',
  RelationParameter = 'relation_parameter',
  ActivityHistory = 'activity_history',
}

export enum ResourceType {
  // Common resources
  MagicDust = 'magic_dust',
  Mithril = 'mithril',
  Moxes = 'moxes',
  // Unique resources
  MollysBeads = 'mollys_beads',
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
}
