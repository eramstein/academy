import type { Npc } from '@/lib/_model';

export const npcs: Record<string, Npc> = {
  administrator: {
    key: 'administrator',
    name: 'Farid El-Khouri, Administrator',
    gold: 0,
    placeKey: 'admin-office',
    attributes: { dexterity: 4, intelligence: 19, vitality: 5, charisma: 8, aura: 15 },
    subscriptions: {},
  },
  molly: {
    key: 'molly',
    name: 'Molly Moreno',
    gold: 0,
    placeKey: 'admin-office',
    attributes: { dexterity: 11, intelligence: 8, vitality: 14, charisma: 18, aura: 9 },
    subscriptions: {},
  },
};
