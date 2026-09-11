export enum DayPeriod {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export enum EventEffectType {
  GetDeck = 'get_deck',
  Subscribe = 'subscribe',
  AddResource = 'add_resource',
}

export enum ActionType {
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
}

export enum NarrationType {
  Text = 'text',
  AttributeCheck = 'attribute_check',
  ConjuredCard = 'conjured_card',
  EncantedCard = 'encanted_card',
  NewPeriod = 'new_period',
  MatchResult = 'match_result',
  Transaction = 'transaction',
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

export enum EventTriggerType {
  Day = 'day',
  Period = 'period',
  ActivityType = 'activity_type',
  Place = 'place',
  CharacterPresent = 'character_present',
}

export enum ResourceType {
  MagicDust = 'magic_dust',
  Mithril = 'mithril',
  Moxes = 'moxes',
}
