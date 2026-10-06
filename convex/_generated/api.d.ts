/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as choiceValidators from "../choiceValidators.js";
import type * as choices from "../choices.js";
import type * as enrichmentValidators from "../enrichmentValidators.js";
import type * as founderSearches from "../founderSearches.js";
import type * as founders from "../founders.js";
import type * as http from "../http.js";
import type * as lib_enrichment from "../lib/enrichment.js";
import type * as lib_evidenceSource from "../lib/evidenceSource.js";
import type * as lib_matching from "../lib/matching.js";
import type * as lib_repairDash from "../lib/repairDash.js";
import type * as matching from "../matching.js";
import type * as matchingStore from "../matchingStore.js";
import type * as matchingValidators from "../matchingValidators.js";
import type * as operatorEnrichment from "../operatorEnrichment.js";
import type * as operatorEnrichmentStore from "../operatorEnrichmentStore.js";
import type * as operatorMaintenance from "../operatorMaintenance.js";
import type * as operatorRiskSearch from "../operatorRiskSearch.js";
import type * as operatorRiskStore from "../operatorRiskStore.js";
import type * as searchRules from "../searchRules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  choiceValidators: typeof choiceValidators;
  choices: typeof choices;
  enrichmentValidators: typeof enrichmentValidators;
  founderSearches: typeof founderSearches;
  founders: typeof founders;
  http: typeof http;
  "lib/enrichment": typeof lib_enrichment;
  "lib/evidenceSource": typeof lib_evidenceSource;
  "lib/matching": typeof lib_matching;
  "lib/repairDash": typeof lib_repairDash;
  matching: typeof matching;
  matchingStore: typeof matchingStore;
  matchingValidators: typeof matchingValidators;
  operatorEnrichment: typeof operatorEnrichment;
  operatorEnrichmentStore: typeof operatorEnrichmentStore;
  operatorMaintenance: typeof operatorMaintenance;
  operatorRiskSearch: typeof operatorRiskSearch;
  operatorRiskStore: typeof operatorRiskStore;
  searchRules: typeof searchRules;
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

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
