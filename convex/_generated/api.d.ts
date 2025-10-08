/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chess_games from "../chess_games.js";
import type * as chess_games_gameEnd from "../chess_games_gameEnd.js";
import type * as games from "../games.js";
import type * as index from "../index.js";
import type * as profiles from "../profiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chess_games: typeof chess_games;
  chess_games_gameEnd: typeof chess_games_gameEnd;
  games: typeof games;
  index: typeof index;
  profiles: typeof profiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
