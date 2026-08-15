export enum DayPeriod {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export enum EventOutcomeType {
  Decision = 'decision',
  Action = 'action',
}

export enum EventEffectType {
  GetDeck = 'get_deck',
  Subscribe = 'subscribe',
}

export enum ActionType {
  Move = 'move',
  Transaction = 'transaction',
  Negotiate = 'negotiate',
  Wait = 'wait',
  Socialize = 'socialize',
  StartMatch = 'start_match',
}

export enum ActionDuration {
  Instant = 'instant',
  Short = 'short',
  Long = 'long',
}

export enum NarrationType {
  Text = 'text',
  AttributeCheck = 'attribute_check',
}

export enum ActivityType {
  Class = 'class',
  Work = 'work',
  Social = 'social',
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
