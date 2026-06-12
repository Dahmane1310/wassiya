/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as admin_access from "../admin/access.js";
import type * as admin_admins from "../admin/admins.js";
import type * as admin_auditLog from "../admin/auditLog.js";
import type * as admin_beneficiaries from "../admin/beneficiaries.js";
import type * as admin_billing from "../admin/billing.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_deathCases from "../admin/deathCases.js";
import type * as admin_entitlements from "../admin/entitlements.js";
import type * as admin_estates from "../admin/estates.js";
import type * as admin_notifications from "../admin/notifications.js";
import type * as admin_switchControl from "../admin/switchControl.js";
import type * as admin_userDetail from "../admin/userDetail.js";
import type * as admin_users from "../admin/users.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as beneficiaries from "../beneficiaries.js";
import type * as crons from "../crons.js";
import type * as entitlements from "../entitlements.js";
import type * as familyMembers from "../familyMembers.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_account from "../lib/account.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_notify from "../lib/notify.js";
import type * as mobileAuth from "../mobileAuth.js";
import type * as notificationSender from "../notificationSender.js";
import type * as recipients from "../recipients.js";
import type * as release from "../release.js";
import type * as switch_ from "../switch.js";
import type * as users from "../users.js";
import type * as vault from "../vault.js";
import type * as wasiyyah from "../wasiyyah.js";
import type * as wrappedKeys from "../wrappedKeys.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  "admin/access": typeof admin_access;
  "admin/admins": typeof admin_admins;
  "admin/auditLog": typeof admin_auditLog;
  "admin/beneficiaries": typeof admin_beneficiaries;
  "admin/billing": typeof admin_billing;
  "admin/dashboard": typeof admin_dashboard;
  "admin/deathCases": typeof admin_deathCases;
  "admin/entitlements": typeof admin_entitlements;
  "admin/estates": typeof admin_estates;
  "admin/notifications": typeof admin_notifications;
  "admin/switchControl": typeof admin_switchControl;
  "admin/userDetail": typeof admin_userDetail;
  "admin/users": typeof admin_users;
  assets: typeof assets;
  auth: typeof auth;
  beneficiaries: typeof beneficiaries;
  crons: typeof crons;
  entitlements: typeof entitlements;
  familyMembers: typeof familyMembers;
  http: typeof http;
  invites: typeof invites;
  "lib/account": typeof lib_account;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/entitlements": typeof lib_entitlements;
  "lib/notify": typeof lib_notify;
  mobileAuth: typeof mobileAuth;
  notificationSender: typeof notificationSender;
  recipients: typeof recipients;
  release: typeof release;
  switch: typeof switch_;
  users: typeof users;
  vault: typeof vault;
  wasiyyah: typeof wasiyyah;
  wrappedKeys: typeof wrappedKeys;
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
