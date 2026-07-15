import type { Npc } from '@/lib/_model';

export const npcs: Record<string, Npc> = {
  administrator: {
    key: 'administrator',
    name: 'Administrator',
    gold: 0,
    placeKey: 'cave',
    attributes: { dexterity: 4, intelligence: 19, vitality: 5, charisma: 8, aura: 15 },
  },
};
