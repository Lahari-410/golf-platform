// lib/drawEngine.ts
// All draw logic lives here — random and algorithmic draw generation
// and prize pool calculation

import { Score } from '@/types'

// PRIZE POOL DISTRIBUTION (from PRD section 07)
export const PRIZE_DISTRIBUTION = {
  FIVE_MATCH: 0.40,   // 40% of pool
  FOUR_MATCH: 0.35,   // 35% of pool
  THREE_MATCH: 0.25,  // 25% of pool
}

// SUBSCRIPTION PRICES (used to calculate prize pool)
export const PRICES = {
  MONTHLY: 10,   // £10/month
  YEARLY: 100,   // £100/year
}

// ── RANDOM DRAW ─────────────────────────────────────────────────────────────
// Generates 5 unique random numbers between 1-45
export function generateRandomDraw(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}

// ── ALGORITHMIC DRAW ─────────────────────────────────────────────────────────
// Generates draw numbers weighted by most/least frequent user scores
// scores = all user scores from this month
export function generateAlgorithmicDraw(scores: Score[]): number[] {
  // Count frequency of each score number
  const frequency: Record<number, number> = {}
  scores.forEach(s => {
    frequency[s.score] = (frequency[s.score] || 0) + 1
  })

  // Sort by frequency descending
  const sorted = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .map(([num]) => parseInt(num))

  // Pick top 5 most frequent, fill rest randomly if needed
  const selected: number[] = []
  for (const num of sorted) {
    if (selected.length >= 5) break
    selected.push(num)
  }

  // If not enough unique scores, fill with random numbers
  while (selected.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!selected.includes(num)) {
      selected.push(num)
    }
  }

  return selected.sort((a, b) => a - b)
}

// ── COUNT MATCHES ─────────────────────────────────────────────────────────────
// Counts how many of a user's scores match the winning numbers
// userScores = user's last 5 scores, winningNumbers = draw result
export function countMatches(userScores: number[], winningNumbers: number[]): number {
  return userScores.filter(score => winningNumbers.includes(score)).length
}

// ── CALCULATE PRIZE POOLS ─────────────────────────────────────────────────────
// totalPool = sum of all subscriber contributions this month
// rolloverJackpot = if previous jackpot wasn't won, it carries forward
export function calculatePrizePools(totalPool: number, rolloverJackpot: number = 0) {
  return {
    jackpot: (totalPool * PRIZE_DISTRIBUTION.FIVE_MATCH) + rolloverJackpot,
    fourMatch: totalPool * PRIZE_DISTRIBUTION.FOUR_MATCH,
    threeMatch: totalPool * PRIZE_DISTRIBUTION.THREE_MATCH,
  }
}

// ── CALCULATE MONTHLY POOL ────────────────────────────────────────────────────
// Based on number of active subscribers and their plan types
export function calculateMonthlyPool(
  monthlySubscribers: number,
  yearlySubscribers: number
): number {
  const monthlyContribution = monthlySubscribers * PRICES.MONTHLY * 0.5  // 50% goes to pool
  const yearlyContribution = yearlySubscribers * (PRICES.YEARLY / 12) * 0.5
  return monthlyContribution + yearlyContribution
}
