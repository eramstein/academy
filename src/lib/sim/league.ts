import { ActivityType, DayPeriod, SchoolName, type Character } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { getCharactersAtScene } from './characters';
import { recordMatchRumor } from './effects/rumors';
import { findNextFreeDay } from './effects/schedule';
import { narrateText } from './narration';
import { scheduleActivity } from './schedule';

const PLAYER_KEY = 'player';
const BYE_KEY = '__bye__';

export function newLeagueSeason(winnerKey: string | null = null) {
  gs.league.season++;
  gs.league.rankings = [{ characterKey: PLAYER_KEY, points: 0 }];
  gs.league.records = {};
  if (winnerKey) {
    gs.league.pastWinners = [winnerKey, ...gs.league.pastWinners];
    const academyStudents = Object.values(gs.characters).filter(
      (character) => character.school === SchoolName.Academy
    );
    scheduleActivity({
      type: ActivityType.LeagueCeremony,
      participants: [
        ...academyStudents.map((character) => character.key),
        'administrator',
        'lombard',
        'glutzenbaum',
      ],
      placeKey: 'academy-hall',
      day: findNextFreeDay(DayPeriod.Evening),
      period: DayPeriod.Evening,
    });
    narrateText(
      `${winnerKey === PLAYER_KEY ? 'You' : gs.characters[winnerKey]?.name} has won the league championship! The students of the Academy gather to celebrate the victory.`
    );
  }
  for (const character of Object.values(gs.characters)) {
    if (character.school === SchoolName.Academy) {
      gs.league.rankings.push({ characterKey: character.key, points: 0 });
    }
  }
}

export function getPossibleLeagueOpponents(): Character[] {
  return getCharactersAtScene().filter(
    (character) => character.school === SchoolName.Academy && !havePlayed(PLAYER_KEY, character.key)
  );
}

export function recordLeagueMatchResult(won: boolean) {
  if (!gs.ongoingBattle) {
    return;
  }
  const opponentKey = gs.ongoingBattle.opponentKey;
  recordPlayedMatch(PLAYER_KEY, opponentKey, won);
  if (won) {
    gs.characters[opponentKey].matchesRecord.won++;
  } else {
    gs.characters[opponentKey].matchesRecord.lost++;
  }
  recordMatchRumor(opponentKey, won);
  autoPlayOtherLeagueMatches();
  // Odd-sized leagues give the player one bye round; those NPC-vs-NPC matches
  // are never auto-played unless we resolve them once the player is done.
  if (hasPlayerFinishedAllMatches()) {
    resolveRemainingLeagueMatches();
  }
  gs.league.playedToday = true;
  if (isSeasonComplete()) {
    newLeagueSeason(getSeasonWinner());
  }
}

function isSeasonComplete(): boolean {
  const participants = getLeagueParticipants();
  const matchesPerPlayer = participants.length - 1;
  if (matchesPerPlayer < 1) {
    return false;
  }
  return participants.every((key) => (gs.league.records[key]?.length ?? 0) >= matchesPerPlayer);
}

function hasPlayerFinishedAllMatches(): boolean {
  const participants = getLeagueParticipants();
  return participants
    .filter((key) => key !== PLAYER_KEY)
    .every((key) => havePlayed(PLAYER_KEY, key));
}

/** Play any still-unplayed pairings (the player's bye round in odd-sized leagues). */
function resolveRemainingLeagueMatches() {
  const participants = getLeagueParticipants();
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const aKey = participants[i];
      const bKey = participants[j];
      if (havePlayed(aKey, bKey)) {
        continue;
      }
      const winnerKey = resolveNpcMatchWinner(aKey, bKey);
      recordPlayedMatch(aKey, bKey, winnerKey === aKey);
    }
  }
}

function getSeasonWinner(): string {
  const [leader] = [...gs.league.rankings].sort(
    (a, b) => b.points - a.points || a.characterKey.localeCompare(b.characterKey)
  );
  return leader?.characterKey ?? PLAYER_KEY;
}

function autoPlayOtherLeagueMatches() {
  if (!gs.ongoingBattle) {
    return;
  }
  const otherPairings = getOtherPairingsForRound(PLAYER_KEY, gs.ongoingBattle.opponentKey);
  for (const [aKey, bKey] of otherPairings) {
    if (havePlayed(aKey, bKey)) {
      continue;
    }
    const winnerKey = resolveNpcMatchWinner(aKey, bKey);
    recordPlayedMatch(aKey, bKey, winnerKey === aKey);
  }
}

/** Higher tcgSkill wins; coin flip when skills are equal. */
function resolveNpcMatchWinner(aKey: string, bKey: string): string {
  const aSkill = gs.characters[aKey]?.tcgSkill ?? 0;
  const bSkill = gs.characters[bKey]?.tcgSkill ?? 0;
  if (aSkill !== bSkill) {
    return aSkill > bSkill ? aKey : bKey;
  }
  return getRandomFromArray([aKey, bKey]);
}

function havePlayed(aKey: string, bKey: string): boolean {
  return !!gs.league.records[aKey]?.some((record) => record.opponentKey === bKey);
}

function recordPlayedMatch(aKey: string, bKey: string, aWon: boolean) {
  gs.league.records = {
    ...gs.league.records,
    [aKey]: [...(gs.league.records[aKey] ?? []), { opponentKey: bKey, won: aWon }],
    [bKey]: [...(gs.league.records[bKey] ?? []), { opponentKey: aKey, won: !aWon }],
  };
  const winnerKey = aWon ? aKey : bKey;
  gs.league.rankings = gs.league.rankings.map((ranking) =>
    ranking.characterKey === winnerKey ? { ...ranking, points: ranking.points + 1 } : ranking
  );
}

function getLeagueParticipants(): string[] {
  return gs.league.rankings.map((ranking) => ranking.characterKey);
}

/** Other matches in the round-robin round that contains player vs opponent. */
function getOtherPairingsForRound(playerKey: string, opponentKey: string): [string, string][] {
  return getRoundRobinPairings(getLeagueParticipants(), playerKey, opponentKey).filter(
    ([aKey, bKey]) => !isPair(aKey, bKey, playerKey, opponentKey)
  );
}

function isPair(aKey: string, bKey: string, xKey: string, yKey: string): boolean {
  return (aKey === xKey && bKey === yKey) || (aKey === yKey && bKey === xKey);
}

/**
 * Circle-method 1-factorization of K_n: the player's chosen opponent uniquely
 * determines the rest of the round, so everyone plays everyone once.
 */
function getRoundRobinPairings(
  participants: string[],
  playerKey: string,
  opponentKey: string
): [string, string][] {
  const players = [...participants];
  if (players.length % 2 === 1) {
    players.push(BYE_KEY);
  }
  const n = players.length;
  if (n < 2) {
    return [];
  }
  const circleSize = n - 1;
  const playerIndex = players.indexOf(playerKey);
  const opponentIndex = players.indexOf(opponentKey);
  if (playerIndex === -1 || opponentIndex === -1) {
    return [];
  }
  const round = roundIndexForPair(playerIndex, opponentIndex, n);
  const pairings: [string, string][] = [[players[n - 1], players[round]]];
  for (let distance = 1; distance < n / 2; distance++) {
    const aIndex = (round - distance + circleSize) % circleSize;
    const bIndex = (round + distance) % circleSize;
    pairings.push([players[aIndex], players[bIndex]]);
  }
  return pairings.filter(([aKey, bKey]) => aKey !== BYE_KEY && bKey !== BYE_KEY);
}

function roundIndexForPair(i: number, j: number, n: number): number {
  const circleSize = n - 1;
  const fixedIndex = n - 1;
  if (i === fixedIndex) {
    return j;
  }
  if (j === fixedIndex) {
    return i;
  }
  // Positions i and j are paired in round k iff i + j ≡ 2k (mod circleSize).
  // circleSize is odd, so 2 has inverse (circleSize + 1) / 2.
  const inv2 = (circleSize + 1) / 2;
  return ((i + j) * inv2) % circleSize;
}
