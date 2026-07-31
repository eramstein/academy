import type { Place, Region } from '@/lib/_model/model-game';

const PLACES: Record<string, Place> = {
  ['admin-office']: {
    key: 'admin-office',
    name: 'Administration Office',
    description:
      'The Administration Office is the central hub of the Academy. It is here that the students and staff gather to discuss the latest news and events.',
  },
  ['barracks']: {
    key: 'barracks',
    name: 'Baracks',
    description: 'Cheap housing for the students.',
  },
  ['cafeteria']: {
    key: 'cafeteria',
    name: 'Cafeteria',
    description: 'The cafeteria is a place where the students can eat and socialize.',
  },
  ['library']: {
    key: 'library',
    name: 'Library',
    description: 'The library is a place where the students can read and study.',
  },
  ['artificery-room']: {
    key: 'artificery-room',
    name: 'Artificery Class Room',
    description: 'The artificery room is a place where the students can create and modify items.',
  },
  ['enchanting-room']: {
    key: 'enchanting-room',
    name: 'Enchanting Class Room',
    description: 'The enchanting room is a place where the students can enchant items.',
  },

  ['old-monk-inn']: {
    key: 'old-monk-inn',
    name: "Old Monk's Inn",
    description: "The Old Monk's Inn is arustic old inn with a cozy atmosphere.",
  },
  ['royal-pigeon-inn']: {
    key: 'royal-pigeon-inn',
    name: 'Royal Pigeon Inn',
    description: 'The Royal Pigeon Inn is a luxurious inn with a fancy atmosphere.',
  },
  ['metarials-shop']: {
    key: 'metarials-shop',
    name: 'Metarials Shop',
    description: 'The Metarials Shop is a place where the students can buy and sell materials.',
  },
} as const;

const REGIONS: Record<string, Region> = {
  ['academy']: {
    key: 'academy',
    name: 'The Academy',
    description: 'The Academy is a place where the students can learn and grow.',
    placeKeys: [
      'admin-office',
      'barracks',
      'cafeteria',
      'library',
      'artificery-room',
      'enchanting-room',
    ],
  },
  ['town']: {
    key: 'town',
    name: 'Godsend Town',
    description: 'Godsend Town is a small town with a lot of people and a lot of things to do.',
    placeKeys: ['old-monk-inn', 'royal-pigeon-inn', 'metarials-shop'],
  },
} as const;

export { PLACES, REGIONS };
