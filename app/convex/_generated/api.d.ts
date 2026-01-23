/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as farmerObservations from "../farmerObservations.js";
import type * as farms from "../farms.js";
import type * as grazingAgentDirect from "../grazingAgentDirect.js";
import type * as grazingAgentGateway from "../grazingAgentGateway.js";
import type * as grazingAgentTools from "../grazingAgentTools.js";
import type * as intelligence from "../intelligence.js";
import type * as intelligenceActions from "../intelligenceActions.js";
import type * as observations from "../observations.js";
import type * as paddocks from "../paddocks.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";
import type * as zones from "../zones.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  farmerObservations: typeof farmerObservations;
  farms: typeof farms;
  grazingAgentDirect: typeof grazingAgentDirect;
  grazingAgentGateway: typeof grazingAgentGateway;
  grazingAgentTools: typeof grazingAgentTools;
  intelligence: typeof intelligence;
  intelligenceActions: typeof intelligenceActions;
  observations: typeof observations;
  paddocks: typeof paddocks;
  seedData: typeof seedData;
  settings: typeof settings;
  users: typeof users;
  zones: typeof zones;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
