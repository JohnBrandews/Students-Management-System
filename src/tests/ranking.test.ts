import test from "node:test";
import assert from "node:assert";

// Simplified pure function mimicking the exact ranking logic inside resultsEngine.ts
function computeRankings(scores: number[]): number[] {
  // Sort descending
  const sorted = [...scores].sort((a, b) => b - a);
  const ranks: number[] = [];
  
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] < sorted[i - 1]) {
      rank = i + 1;
    }
    ranks.push(rank);
  }
  return ranks;
}

test("Tie-Aware Standard Competition Ranking (1-1-3)", () => {
  // Scenario 1: A single tie at the top
  const inputScores = [90, 90, 80, 70, 70, 60];
  const expectedRanks = [1, 1, 3, 4, 4, 6];
  
  const actualRanks = computeRankings(inputScores);
  assert.deepStrictEqual(actualRanks, expectedRanks);
});

test("Ranking with no ties", () => {
  const inputScores = [95, 85, 75, 65];
  const expectedRanks = [1, 2, 3, 4];
  
  const actualRanks = computeRankings(inputScores);
  assert.deepStrictEqual(actualRanks, expectedRanks);
});

test("Ranking with all ties", () => {
  const inputScores = [80, 80, 80, 80];
  const expectedRanks = [1, 1, 1, 1];
  
  const actualRanks = computeRankings(inputScores);
  assert.deepStrictEqual(actualRanks, expectedRanks);
});
