/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminLinks from "../adminLinks.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as adminOperatorLinks from "../adminOperatorLinks.js";
import type * as adminRequests from "../adminRequests.js";
import type * as choiceValidators from "../choiceValidators.js";
import type * as choices from "../choices.js";
import type * as enrichmentValidators from "../enrichmentValidators.js";
import type * as founderSearches from "../founderSearches.js";
import type * as founders from "../founders.js";
import type * as http from "../http.js";
import type * as introductionStore from "../introductionStore.js";
import type * as introductionWelcome from "../introductionWelcome.js";
import type * as introductions from "../introductions.js";
import type * as lib_enrichment from "../lib/enrichment.js";
import type * as lib_evidenceSource from "../lib/evidenceSource.js";
import type * as lib_fitList from "../lib/fitList.js";
import type * as lib_matching from "../lib/matching.js";
import type * as lib_meetingResponses from "../lib/meetingResponses.js";
import type * as lib_operatorApplication from "../lib/operatorApplication.js";
import type * as lib_operatorLinkSecrets from "../lib/operatorLinkSecrets.js";
import type * as lib_operatorNumbers from "../lib/operatorNumbers.js";
import type * as lib_opportunity from "../lib/opportunity.js";
import type * as lib_paymentLabel from "../lib/paymentLabel.js";
import type * as lib_repairDash from "../lib/repairDash.js";
import type * as lib_revenueLabels from "../lib/revenueLabels.js";
import type * as lib_safeWelcomeError from "../lib/safeWelcomeError.js";
import type * as matching from "../matching.js";
import type * as matchingDiagnosticStore from "../matchingDiagnosticStore.js";
import type * as matchingDiagnostics from "../matchingDiagnostics.js";
import type * as matchingRefresh from "../matchingRefresh.js";
import type * as matchingRefreshStore from "../matchingRefreshStore.js";
import type * as matchingStore from "../matchingStore.js";
import type * as matchingValidators from "../matchingValidators.js";
import type * as operatorApplicationHttp from "../operatorApplicationHttp.js";
import type * as operatorApplicationValidators from "../operatorApplicationValidators.js";
import type * as operatorApplications from "../operatorApplications.js";
import type * as operatorApprovalMatching from "../operatorApprovalMatching.js";
import type * as operatorApprovalStore from "../operatorApprovalStore.js";
import type * as operatorEnrichment from "../operatorEnrichment.js";
import type * as operatorEnrichmentStore from "../operatorEnrichmentStore.js";
import type * as operatorLinks from "../operatorLinks.js";
import type * as operatorMaintenance from "../operatorMaintenance.js";
import type * as operatorNumbers from "../operatorNumbers.js";
import type * as operatorRequests from "../operatorRequests.js";
import type * as operatorResponses from "../operatorResponses.js";
import type * as operatorRiskSearch from "../operatorRiskSearch.js";
import type * as operatorRiskStore from "../operatorRiskStore.js";
import type * as productionRelease from "../productionRelease.js";
import type * as responseValidators from "../responseValidators.js";
import type * as revealPaymentHttp from "../revealPaymentHttp.js";
import type * as revealPayments from "../revealPayments.js";
import type * as searchRules from "../searchRules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminLinks: typeof adminLinks;
  adminNotifications: typeof adminNotifications;
  adminOperatorLinks: typeof adminOperatorLinks;
  adminRequests: typeof adminRequests;
  choiceValidators: typeof choiceValidators;
  choices: typeof choices;
  enrichmentValidators: typeof enrichmentValidators;
  founderSearches: typeof founderSearches;
  founders: typeof founders;
  http: typeof http;
  introductionStore: typeof introductionStore;
  introductionWelcome: typeof introductionWelcome;
  introductions: typeof introductions;
  "lib/enrichment": typeof lib_enrichment;
  "lib/evidenceSource": typeof lib_evidenceSource;
  "lib/fitList": typeof lib_fitList;
  "lib/matching": typeof lib_matching;
  "lib/meetingResponses": typeof lib_meetingResponses;
  "lib/operatorApplication": typeof lib_operatorApplication;
  "lib/operatorLinkSecrets": typeof lib_operatorLinkSecrets;
  "lib/operatorNumbers": typeof lib_operatorNumbers;
  "lib/opportunity": typeof lib_opportunity;
  "lib/paymentLabel": typeof lib_paymentLabel;
  "lib/repairDash": typeof lib_repairDash;
  "lib/revenueLabels": typeof lib_revenueLabels;
  "lib/safeWelcomeError": typeof lib_safeWelcomeError;
  matching: typeof matching;
  matchingDiagnosticStore: typeof matchingDiagnosticStore;
  matchingDiagnostics: typeof matchingDiagnostics;
  matchingRefresh: typeof matchingRefresh;
  matchingRefreshStore: typeof matchingRefreshStore;
  matchingStore: typeof matchingStore;
  matchingValidators: typeof matchingValidators;
  operatorApplicationHttp: typeof operatorApplicationHttp;
  operatorApplicationValidators: typeof operatorApplicationValidators;
  operatorApplications: typeof operatorApplications;
  operatorApprovalMatching: typeof operatorApprovalMatching;
  operatorApprovalStore: typeof operatorApprovalStore;
  operatorEnrichment: typeof operatorEnrichment;
  operatorEnrichmentStore: typeof operatorEnrichmentStore;
  operatorLinks: typeof operatorLinks;
  operatorMaintenance: typeof operatorMaintenance;
  operatorNumbers: typeof operatorNumbers;
  operatorRequests: typeof operatorRequests;
  operatorResponses: typeof operatorResponses;
  operatorRiskSearch: typeof operatorRiskSearch;
  operatorRiskStore: typeof operatorRiskStore;
  productionRelease: typeof productionRelease;
  responseValidators: typeof responseValidators;
  revealPaymentHttp: typeof revealPaymentHttp;
  revealPayments: typeof revealPayments;
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
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
