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
import type * as geocoding from "../geocoding.js";
import type * as grazingAgentDirect from "../grazingAgentDirect.js";
import type * as grazingAgentGateway from "../grazingAgentGateway.js";
import type * as grazingAgentTools from "../grazingAgentTools.js";
import type * as http from "../http.js";
import type * as intelligence from "../intelligence.js";
import type * as intelligenceActions from "../intelligenceActions.js";
import type * as internal_ from "../internal.js";
import type * as migrations_migrateToClerkOrgs from "../migrations/migrateToClerkOrgs.js";
import type * as noGrazeZones from "../noGrazeZones.js";
import type * as notifications from "../notifications.js";
import type * as observations from "../observations.js";
import type * as organizations from "../organizations.js";
import type * as paddocks from "../paddocks.js";
import type * as satelliteFetchJobs from "../satelliteFetchJobs.js";
import type * as satelliteTiles from "../satelliteTiles.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as waterSources from "../waterSources.js";
import type * as zones from "../zones.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  farmerObservations: typeof farmerObservations;
  farms: typeof farms;
  geocoding: typeof geocoding;
  grazingAgentDirect: typeof grazingAgentDirect;
  grazingAgentGateway: typeof grazingAgentGateway;
  grazingAgentTools: typeof grazingAgentTools;
  http: typeof http;
  intelligence: typeof intelligence;
  intelligenceActions: typeof intelligenceActions;
  internal: typeof internal_;
  "migrations/migrateToClerkOrgs": typeof migrations_migrateToClerkOrgs;
  noGrazeZones: typeof noGrazeZones;
  notifications: typeof notifications;
  observations: typeof observations;
  organizations: typeof organizations;
  paddocks: typeof paddocks;
  satelliteFetchJobs: typeof satelliteFetchJobs;
  satelliteTiles: typeof satelliteTiles;
  seedData: typeof seedData;
  settings: typeof settings;
  subscriptions: typeof subscriptions;
  users: typeof users;
  waterSources: typeof waterSources;
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
