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
import type * as admin from "../admin.js";
import type * as chat from "../chat.js";
import type * as chess_games from "../chess_games.js";
import type * as chess_games_gameEnd from "../chess_games_gameEnd.js";
import type * as games from "../games.js";
import type * as index from "../index.js";
import type * as profiles from "../profiles.js";
import type * as puzzle_admin from "../puzzle_admin.js";
import type * as quiz from "../quiz.js";
import type * as quiz_admin from "../quiz_admin.js";
import type * as test from "../test.js";
import type * as utils_timerHelpers from "../utils/timerHelpers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  chat: typeof chat;
  chess_games: typeof chess_games;
  chess_games_gameEnd: typeof chess_games_gameEnd;
  games: typeof games;
  index: typeof index;
  profiles: typeof profiles;
  puzzle_admin: typeof puzzle_admin;
  quiz: typeof quiz;
  quiz_admin: typeof quiz_admin;
  test: typeof test;
  "utils/timerHelpers": typeof utils_timerHelpers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
