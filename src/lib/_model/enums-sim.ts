export enum DayPeriod {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export enum EventOutcomeType {
  Decision = 'decision',
  Action = 'action',
}

export enum ActionType {
  Move = 'move',
  Transaction = 'transaction',
  Negotiate = 'negotiate',
  Wait = 'wait',
}

export enum ActionDuration {
  Instant = 'instant',
  Short = 'short',
  Long = 'long',
}

export enum SubscriptionType {
  Academy = 'academy',
  Library = 'library',
  Inn = 'inn',
}

export enum TransactionType {
  Subscription = 'subscription',
  Purchase = 'purchase',
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
