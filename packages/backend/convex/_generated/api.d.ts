/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as beneficiaries from "../beneficiaries.js";
import type * as crons from "../crons.js";
import type * as executors from "../executors.js";
import type * as familyMembers from "../familyMembers.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as switch_ from "../switch.js";
import type * as users from "../users.js";
import type * as vault from "../vault.js";
import type * as wasiyyah from "../wasiyyah.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  beneficiaries: typeof beneficiaries;
  crons: typeof crons;
  executors: typeof executors;
  familyMembers: typeof familyMembers;
  http: typeof http;
  invites: typeof invites;
  switch: typeof switch_;
  users: typeof users;
  vault: typeof vault;
  wasiyyah: typeof wasiyyah;
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
  workOSAuthKit: import("@convex-dev/workos-authkit/_generated/component.js").ComponentApi<"workOSAuthKit">;
};
