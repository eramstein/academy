import { SchoolName, type Character } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { getCharactersAtScene } from './characters';

const PLAYER_KEY = 'player';
const BYE_KEY = '__bye__';

export function newLeagueSeason() {
  gs.league.season++;
  gs.league.rankings = [{ characterKey: PLAYER_KEY, points: 0 }];
  gs.league.records = {};
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
  recordPlayedMatch(PLAYER_KEY, gs.ongoingBattle.opponentKey, won);
  autoPlayOtherLeagueMatches();
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
    const winnerKey = getRandomFromArray([aKey, bKey]);
    recordPlayedMatch(aKey, bKey, winnerKey === aKey);
  }
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
