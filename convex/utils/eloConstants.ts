/**
 * ELO Rating System Constants
 * 
 * This file defines the constants and K-factors used for ELO rating calculations
 * in the AdNU Chess platform.
 */

/**
 * Initial ELO rating for all new players
 */
export const INITIAL_ELO_RATING = 1500;

/**
 * K-Factor Configuration
 * 
 * The K-factor determines how much a player's rating can change after a single game.
 * Higher K-factors mean more volatile ratings (bigger swings).
 */
export const ELO_K_FACTORS = {
  /**
   * K-factor for provisional players (less than 30 completed games)
   * Higher volatility allows new players to quickly reach their true skill level
   */
  PROVISIONAL: 40,
  
  /**
   * K-factor for established players (30 or more completed games)
   * Lower volatility provides more stable ratings for experienced players
   */
  ESTABLISHED: 20,
} as const;

/**
 * Threshold for determining provisional vs established player status
 * Players with fewer games than this threshold are considered provisional
 */
export const PROVISIONAL_GAMES_THRESHOLD = 30;

/**
 * Get the appropriate K-factor for a player based on their games played
 * 
 * @param gamesPlayed - The number of completed games for the player
 * @returns The K-factor to use for ELO calculations
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < PROVISIONAL_GAMES_THRESHOLD) {
    return ELO_K_FACTORS.PROVISIONAL;
  }
  return ELO_K_FACTORS.ESTABLISHED;
}

/**
 * Check if a player is considered provisional (still in rating calibration)
 * 
 * @param gamesPlayed - The number of completed games for the player
 * @returns true if the player is provisional, false if established
 */
export function isProvisionalPlayer(gamesPlayed: number): boolean {
  return gamesPlayed < PROVISIONAL_GAMES_THRESHOLD;
}

/**
 * Calculate expected score for a player in a match
 * 
 * @param playerRating - The ELO rating of the player
 * @param opponentRating - The ELO rating of the opponent
 * @returns Expected score (probability of winning) between 0 and 1
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a game
 * 
 * @param currentRating - The player's current ELO rating
 * @param expectedScore - The expected score (from calculateExpectedScore)
 * @param actualScore - The actual score (1 for win, 0.5 for draw, 0 for loss)
 * @param kFactor - The K-factor to use for this calculation
 * @returns The new ELO rating (rounded to nearest integer)
 */
export function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number,
  kFactor: number
): number {
  const newRating = currentRating + kFactor * (actualScore - expectedScore);
  return Math.round(newRating);
}

/**
 * Actual Score values for ELO calculation
 * 
 * Mapping:
 * - Win: S_A = 1
 * - Draw: S_A = 0.5
 * - Loss: S_A = 0
 */
export const ACTUAL_SCORE = {
  WIN: 1,
  DRAW: 0.5,
  LOSS: 0,
} as const;

/**
 * Game result scores for ELO calculation
 * Alias for ACTUAL_SCORE for backward compatibility
 */
export const GAME_RESULT_SCORES = ACTUAL_SCORE;

export type ActualScore = (typeof ACTUAL_SCORE)[keyof typeof ACTUAL_SCORE];

/**
 * Calculate the new ELO rating for Player A based on game result
 * 
 * This is a pure function that implements the standard ELO rating formulas:
 * 
 * Expected Score: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 * New Rating: R'_A = R_A + K × (S_A - E_A)
 * 
 * @param ratingA - Current ELO rating of Player A (R_A)
 * @param ratingB - Current ELO rating of Player B (R_B)
 * @param scoreA - Actual score for Player A (S_A): 1 = win, 0.5 = draw, 0 = loss
 * @param kFactorA - K-factor for Player A (K), determines rating volatility
 * @returns The new ELO rating for Player A (R'_A), rounded to the nearest integer
 * 
 * @example
 * // Player A (1500) beats Player B (1400) with K-factor 20
 * calculateNewElo(1500, 1400, 1, 20) // Returns 1514
 * 
 * @example
 * // Player A (1500) loses to Player B (1400) with K-factor 20
 * calculateNewElo(1500, 1400, 0, 20) // Returns 1486
 * 
 * @example
 * // Player A (1500) draws with Player B (1400) with K-factor 20
 * calculateNewElo(1500, 1400, 0.5, 20) // Returns 1500
 */
export function calculateNewElo(
  ratingA: number,
  ratingB: number,
  scoreA: ActualScore,
  kFactorA: number
): number {
  // Calculate expected score: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
  const expectedScore = calculateExpectedScore(ratingA, ratingB);
  
  // Calculate new rating: R'_A = R_A + K × (S_A - E_A)
  const newRating = ratingA + kFactorA * (scoreA - expectedScore);
  
  // Round to nearest integer and return
  return Math.round(newRating);
}
