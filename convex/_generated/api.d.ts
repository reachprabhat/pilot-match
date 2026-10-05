/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as enrichmentValidators from "../enrichmentValidators.js";
import type * as founders from "../founders.js";
import type * as http from "../http.js";
import type * as lib_enrichment from "../lib/enrichment.js";
import type * as lib_evidenceSource from "../lib/evidenceSource.js";
import type * as lib_repairDash from "../lib/repairDash.js";
import type * as operatorEnrichment from "../operatorEnrichment.js";
import type * as operatorEnrichmentStore from "../operatorEnrichmentStore.js";
import type * as operatorMaintenance from "../operatorMaintenance.js";
import type * as operatorRiskSearch from "../operatorRiskSearch.js";
import type * as operatorRiskStore from "../operatorRiskStore.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  enrichmentValidators: typeof enrichmentValidators;
  founders: typeof founders;
  http: typeof http;
  "lib/enrichment": typeof lib_enrichment;
  "lib/evidenceSource": typeof lib_evidenceSource;
  "lib/repairDash": typeof lib_repairDash;
  operatorEnrichment: typeof operatorEnrichment;
  operatorEnrichmentStore: typeof operatorEnrichmentStore;
  operatorMaintenance: typeof operatorMaintenance;
  operatorRiskSearch: typeof operatorRiskSearch;
  operatorRiskStore: typeof operatorRiskStore;
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
