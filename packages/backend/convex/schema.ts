import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { dictValidator } from "./lib/landingValidator"

// Shared shape for every ciphertext column. Mirrors `EncryptedDataPackage` from
// `@workspace/crypto` (packages/crypto/src/index.ts): base64 AES-GCM ciphertext +
// the base64 12-byte IV it was sealed with. The server stores these opaquely and
// can never decrypt them — that is the zero-knowledge contract.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

export default defineSchema({
  // App-side per-user data, keyed to the WorkOS identity. The AuthKit synced
  // user store is read-only, so app-specific fields live here.
  users: defineTable({
    // From `ctx.auth.getUserIdentity().tokenIdentifier` — the canonical stable id.
    tokenIdentifier: v.string(),
    // PIN + Recovery-Key model (zero-knowledge): a random master key (MK) is wrapped
    // three ways. The PIN wrap lives ONLY on the device; only the RECOVERY wrap is
    // stored here — the recovery code is high-entropy, so even with the salt + wrapped
    // key the server cannot brute-force MK. The PIN/PIN-salt NEVER reach the server.
    //
    // Base64 PBKDF2 salt for the recovery-key derivation. NOT secret.
    recoverySalt: v.string(),
    // The master key, AES-GCM-wrapped under the recovery-key-derived key (+ its IV).
    // This is the only server-side path back to MK (new device / forgotten PIN).
    recoveryWrappedKey: v.string(),
    recoveryWrapIv: v.string(),
    // Optional sentinel encrypted with the master key — a clean integrity cross-check
    // on recovery. No weaker than the encrypted assets; the AES-GCM auth tag on the
    // recovery unwrap is the real proof of a correct recovery key.
    vaultVerifier: v.optional(encrypted),
    // "Two-Step" SSO vault onboarding complete. SSO authenticates the account; it
    // NEVER unlocks the vault — the local PIN (or the Recovery Key) does.
    onboardingComplete: v.optional(v.boolean()),
    // The OWNER's (deceased's) gender — needed by the Fara'id engine (the spouse's
    // share depends on whether the deceased is husband or wife). Non-secret structural data.
    ownerGender: v.optional(v.union(v.literal("male"), v.literal("female"))),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // Per-owner subscription/entitlement state. SOURCE-AGNOSTIC: a row can come from
  // the 14-day trial (started at vault setup), Stripe, native IAP, or a manual grant.
  // Kept OFF the `users` table on purpose — `users` can't exist before vault setup
  // (its recovery fields are non-optional), but a user may pay BEFORE onboarding, so
  // entitlement must be able to exist independently. Default = no row = synthesized
  // trial (see lib/entitlements.ts). The reactive read returns the raw
  // `currentPeriodEnd`; the cron keeps `status` fresh (never read wall-clock in a query).
  entitlements: defineTable({
    ownerId: v.string(), // tokenIdentifier
    plan: v.union(
      v.literal("trial"),
      v.literal("annual"),
      v.literal("lifetime"),
    ),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired"),
    ),
    source: v.union(
      v.literal("trial"),
      v.literal("stripe"),
      v.literal("apple"),
      v.literal("google"),
      v.literal("manual"),
    ),
    externalCustomerId: v.optional(v.string()), // Stripe customer / RevenueCat app-user id
    externalSubscriptionId: v.optional(v.string()),
    // The single "access ends at" anchor: trial end while `trialing`, period end while
    // `annual`. UNDEFINED for `lifetime` — which is why the expiry sweep never touches it.
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_ownerId", ["ownerId"])
    // Cron expiry sweep: rows of a given status whose period has elapsed.
    .index("by_status_and_currentPeriodEnd", ["status", "currentPeriodEnd"])
    // Future webhook: resolve owner from a processor's customer id.
    .index("by_externalCustomerId", ["externalCustomerId"])
    // Admin-panel server-side filters.
    .index("by_plan", ["plan"])
    .index("by_status_and_plan", ["status", "plan"]),

  // Append-only billing ledger + idempotency seam. Kept separate from `auditLog` so that
  // table's event union stays focused on vault actions. `externalEventId` dedupes
  // processor webhooks (e.g. a Stripe event id) so a redelivery is a no-op.
  billingEvents: defineTable({
    ownerId: v.optional(v.string()), // may be unknown for some raw processor events
    source: v.union(
      v.literal("trial"),
      v.literal("stripe"),
      v.literal("apple"),
      v.literal("google"),
      v.literal("manual"),
    ),
    externalEventId: v.optional(v.string()), // idempotency key
    type: v.string(), // trial_started | granted | renewed | expired | canceled | refunded | manual_grant
    plan: v.optional(
      v.union(v.literal("trial"), v.literal("annual"), v.literal("lifetime")),
    ),
    meta: v.optional(v.record(v.string(), v.string())), // non-secret context only
  })
    .index("by_externalEventId", ["externalEventId"]) // dedup
    .index("by_ownerId", ["ownerId"]),

  // The dead-man's-switch state machine, one row per owner. Stable config plus
  // current state; release is evaluated server-side only, never client-claimed.
  switchState: defineTable({
    ownerId: v.string(), // tokenIdentifier
    checkInIntervalMs: v.number(), // expected cadence between check-ins
    gracePeriodMs: v.number(), // countdown after a missed check-in
    state: v.union(
      v.literal("active"), // healthy, checking in
      v.literal("grace"), // missed deadline, counting down
      // grace lapsed; awaiting attestation / admin death-cert approval before release
      v.literal("pendingVerification"),
      v.literal("released"), // switch fired, content authorized
      v.literal("paused"), // owner paused (e.g. travel)
    ),
    lastCheckInAt: v.number(),
    nextDeadlineAt: v.number(), // lastCheckInAt + interval
    graceStartedAt: v.optional(v.number()),
    releaseAuthorizedAt: v.optional(v.number()),
    // Layered-release config (see deathAttestations / deathVerification below).
    requireDeathVerification: v.optional(v.boolean()), // release also needs an approved cert
    longstopMs: v.optional(v.number()), // backstop auto-release if verification never comes
    pendingVerificationStartedAt: v.optional(v.number()),
    // Consecutive on-time check-ins; bumped on check-in, reset to 0 when the cron
    // moves a missed row into grace. Display-only ("N in a row" on the Vault home).
    checkInStreak: v.optional(v.number()),
  })
    .index("by_ownerId", ["ownerId"])
    // Cron sweeps "active"/"grace" rows whose deadline has passed.
    .index("by_state_and_nextDeadlineAt", ["state", "nextDeadlineAt"]),

  // High-churn heartbeat log, kept off the stable switchState row so check-in
  // writes don't contend with reads of the whole state document.
  checkIns: defineTable({
    ownerId: v.string(),
    source: v.union(v.literal("manual"), v.literal("auto")),
  }).index("by_ownerId", ["ownerId"]), // ordered by _creationTime within owner

  // Fully-encrypted vault entries. Type, label, value, notes — and a "debt" entry
  // kind — all live inside `payload`; the server learns nothing about what an asset
  // is. The per-asset data key (DEK) is NEVER stored unwrapped: the owner's copy is
  // inline (ownerWrappedKey), beneficiary copies live in `wrappedKeys`.
  assets: defineTable({
    ownerId: v.string(),
    payload: encrypted, // all detail, DEK-encrypted
    storageId: v.optional(v.id("_storage")), // encrypted file Blob (deeds, PDFs)
    fileIv: v.optional(v.string()), // IV for the DEK-encrypted file Blob
    ownerWrappedKey: v.string(), // DEK wrapped with the master key (AES-GCM)
    ownerWrapIv: v.string(), // IV for that symmetric DEK wrap
  }).index("by_ownerId", ["ownerId"]),

  // Per-(asset, beneficiary) copy of the DEK, asymmetrically wrapped to the
  // beneficiary's public key. A child table (count grows with beneficiaries) so it
  // never bloats the asset row or hits the array / 1MB limits.
  wrappedKeys: defineTable({
    assetId: v.id("assets"),
    beneficiaryId: v.id("beneficiaries"),
    wrappedKey: v.string(), // DEK encrypted to beneficiary.publicKey (RSA-OAEP, no IV)
    algorithm: v.string(), // e.g. "RSA-OAEP-256" / "ECIES-X25519"
    // SHA-256 of the public key (spki) this DEK was wrapped under. Binds the wrap
    // to a specific key so a later server-side key substitution is DETECTABLE
    // (compare against the fingerprint the owner verified out-of-band). ZK guard.
    keyFingerprint: v.string(),
  })
    .index("by_assetId", ["assetId"])
    .index("by_beneficiaryId", ["beneficiaryId"]) // release: "all keys wrapped to me"
    // reconciliation pass: idempotent "does a wrapped key already exist?" check
    .index("by_assetId_and_beneficiaryId", ["assetId", "beneficiaryId"]),

  // People who may decrypt vault content after release. They hold an enrolled
  // keypair (public half here); contact email is plaintext so the server can
  // notify them at release. No asset may be created while a designated beneficiary
  // is still "invited" — that invariant eliminates the lockout window.
  beneficiaries: defineTable({
    ownerId: v.string(),
    contactEmail: v.string(), // plaintext — invite + release notification
    status: v.union(v.literal("invited"), v.literal("enrolled")),
    linkedUserId: v.optional(v.string()), // their own tokenIdentifier once they sign up
    label: v.optional(encrypted), // owner's private note/name for them
    // Owner's display name, captured server-side from the owner's WorkOS profile when
    // they issue the invite (owner consents by naming them). Plaintext so the
    // beneficiary can see WHO named them on the web portal. Not secret estate data.
    ownerName: v.optional(v.string()),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_linkedUserId", ["linkedUserId"]) // a beneficiary finds vaults naming them
    .index("by_contactEmail", ["contactEmail"]), // invite/enrollment lookup

  // A beneficiary-user's release keypair — ONE per person (`userId` = their WorkOS
  // tokenIdentifier), NOT per beneficiary row, because one person can be named by
  // several owners and must use the same key for all. The owner wraps DEKs to
  // `publicKey`; the private half is recovery-wrapped (zero-knowledge — the server
  // can't recover it without the beneficiary's Recovery Code) for survival across
  // devices over the years until release.
  recipientKeys: defineTable({
    userId: v.string(), // beneficiary's tokenIdentifier
    publicKey: v.string(), // base64 SPKI (RSA-OAEP)
    keyFingerprint: v.string(), // base64 SHA-256(spki) — out-of-band verification
    recoverySalt: v.string(),
    wrappedPrivateKey: v.string(), // PKCS#8, AES-GCM-wrapped under the recovery key
    wrappedPrivateKeyIv: v.string(),
  }).index("by_userId", ["userId"]),

  // The family-tree graph. Structural fields are plaintext because the Fara'id
  // engine must read them (CLAUDE.md §4); identifying PII (name) is encrypted.
  // LINEAGE IS LOAD-BEARING — fractions differ by it, and a wrong fraction is an
  // existential failure: maternal half-siblings inherit on a different rule from
  // full/paternal; paternal grandparents substitute for the father; a son's child
  // substitutes for a predeceased son while a daughter's child generally does not.
  familyMembers: defineTable({
    ownerId: v.string(),
    relationship: v.union(
      v.literal("spouse"),
      v.literal("father"),
      v.literal("mother"),
      v.literal("son"),
      v.literal("daughter"),
      v.literal("brother"),
      v.literal("sister"),
      v.literal("grandfather"),
      v.literal("grandmother"),
      v.literal("grandson"),
      v.literal("granddaughter"),
      // NON-inheriting relatives only — every true heir needs a computable relation.
      v.literal("other"),
    ),
    // Disambiguates the rules above. Absent where lineage is irrelevant
    // (spouse/father/mother/son/daughter).
    lineage: v.optional(
      v.union(v.literal("full"), v.literal("paternal"), v.literal("maternal")),
    ),
    gender: v.union(v.literal("male"), v.literal("female")), // required by Fara'id math
    isAlive: v.boolean(), // evaluated at the moment the switch fires
    parentMemberId: v.optional(v.id("familyMembers")), // graph edge for traversal
    name: encrypted, // PII — encrypted
    linkedBeneficiaryId: v.optional(v.id("beneficiaries")), // if this heir also decrypts content
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_parentMemberId", ["parentMemberId"]),

  // The freely-willed bequest, modelled as PERCENTAGES (never amounts) so the
  // server can enforce the 33.3% cap without ever seeing a value. The sum across
  // an owner MUST be validated ≤ 33.3 on every write.
  wasiyyahAllocations: defineTable({
    ownerId: v.string(),
    beneficiaryId: v.id("beneficiaries"),
    percentage: v.number(), // 0–33.3, plaintext; server-validated
    note: v.optional(encrypted),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_beneficiaryId", ["beneficiaryId"]),

  // Frozen snapshot the server writes when the switch fires: Fara'id fractions
  // computed from LIVING relatives at that instant, plus the Wasiyyah percentages.
  // Derived, immutable audit record — one row per heir/recipient.
  releaseDistribution: defineTable({
    ownerId: v.string(),
    familyMemberId: v.optional(v.id("familyMembers")), // legal heir, or
    beneficiaryId: v.optional(v.id("beneficiaries")), // Wasiyyah recipient
    kind: v.union(v.literal("faraid"), v.literal("wasiyyah")),
    fractionNumerator: v.number(),
    fractionDenominator: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  // The source of "admin-ness" for the back-office. `users` has no role field and
  // apps/admin uses the same WorkOS auth as every other user, so authority must come
  // from membership in this server-checked allowlist. Two roles: ONE "superadmin"
  // (bootstrapped from the SUPERADMIN_EMAIL deployment env var, manages other admins)
  // and "admin" (everything else). New admins are invited BY EMAIL — the row starts
  // with `email` only and `tokenIdentifier` is filled in on their first sign-in
  // (activation), after which every check is a pure by_tokenIdentifier lookup.
  admins: defineTable({
    tokenIdentifier: v.optional(v.string()), // absent until the invite is activated
    email: v.optional(v.string()), // lowercase; invite key + display
    role: v.optional(
      v.union(v.literal("superadmin"), v.literal("admin")), // undefined = "admin"
    ),
    addedBy: v.optional(v.string()),
    note: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")), // self-uploaded panel avatar
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  // The admin-reviewed certificate gate. ONE active row per owner (mutation-enforced).
  // `certificateStorageId` is the SCOPED ZERO-KNOWLEDGE EXCEPTION: the certificate is
  // legal evidence an admin must read, so it is stored PLAINTEXT in private Convex
  // storage — reachable ONLY via the admin-gated signed URL (release.getCertUrl). It
  // is deliberately NOT vault-encrypted; the vault payload itself stays zero-knowledge.
  deathVerification: defineTable({
    ownerId: v.string(),
    status: v.union(
      v.literal("pending"), // awaiting certificate upload
      v.literal("under_review"), // admin is reviewing
      v.literal("approved"), // release authorized
      v.literal("rejected"), // not a valid death event
    ),
    certificateStorageId: v.optional(v.id("_storage")),
    // Resubmission PATCHES this row, so `_creationTime` goes stale — this is the
    // real submission time. The approve guard compares the owner's last check-in
    // against it (a check-in AFTER the report is evidence of life).
    submittedAt: v.optional(v.number()),
    // Reported by the submitter — reviewer context, plaintext non-secret.
    dateOfDeath: v.optional(v.number()),
    submitterRole: v.optional(v.string()), // free-text, e.g. "son, named executor"
    submittedByKind: v.optional(
      v.union(v.literal("executor"), v.literal("beneficiary")),
    ),
    submittedByEmail: v.optional(v.string()),
    reviewedBy: v.optional(v.string()), // admin tokenIdentifier | "system"
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"]), // admin review queue

  // Append-only event log. NEVER stores plaintext secrets/payloads — event types, actor ids,
  // and target ids only. Mutations must never patch or delete rows here.
  auditLog: defineTable({
    ownerId: v.string(), // vault context
    actor: v.string(), // "system" | "admin:<id>" | tokenIdentifier
    event: v.union(
      v.literal("vault_unlocked"),
      v.literal("asset_created"),
      v.literal("asset_updated"),
      v.literal("asset_deleted"),
      v.literal("asset_read_at_release"),
      v.literal("beneficiary_invited"),
      v.literal("beneficiary_enrolled"),
      v.literal("executor_invited"),
      v.literal("attestation_recorded"),
      v.literal("attestation_revoked"),
      v.literal("death_cert_submitted"),
      v.literal("death_cert_reviewed"),
      v.literal("check_in"),
      v.literal("switch_state_changed"),
      v.literal("release_authorized"),
      // Admin-panel actions (actor is "admin:<tokenIdentifier>").
      v.literal("entitlement_granted"),
      v.literal("entitlement_revoked"),
      v.literal("death_review_reopened"),
      v.literal("admin_added"),
      v.literal("admin_removed"),
      v.literal("account_created"),
      v.literal("account_updated"),
      v.literal("account_disabled"),
      v.literal("account_enabled"),
      v.literal("account_deleted"),
      v.literal("notification_retried"),
      v.literal("landing_published"),
      v.literal("landing_draft_discarded"),
      v.literal("integration_updated"),
    ),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    meta: v.optional(v.record(v.string(), v.string())), // non-secret context only
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_event", ["event"]) // admin audit viewer's event filter
    .index("by_ownerId_and_event", ["ownerId", "event"]), // both filters at once

  // Outbox queue drained by an action once an email/push provider is chosen. `payload` holds
  // non-secret template variables only.
  notifications: defineTable({
    ownerId: v.optional(v.string()),
    recipientEmail: v.string(),
    channel: v.union(v.literal("email"), v.literal("push")),
    kind: v.union(
      v.literal("beneficiary_invite"),
      v.literal("executor_invite"),
      v.literal("heartbeat_warning"),
      v.literal("attestation_request"),
      v.literal("death_review_result"),
      v.literal("release_notice"),
      v.literal("password_reset"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()),
    payload: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_status", ["status"]) // drain the queue
    .index("by_ownerId", ["ownerId"])
    // Admin-panel server-side filters/search.
    .index("by_kind", ["kind"])
    .index("by_status_and_kind", ["status", "kind"])
    .index("by_recipientEmail", ["recipientEmail"]),

  // Admin-provisioned accounts awaiting vault setup. A `users` row can't exist
  // before onboarding, so this snapshot keeps the created account visible in the
  // panel. `vault.completeVaultSetup` deletes the row once the vault exists.
  provisionedAccounts: defineTable({
    accountId: v.string(), // full tokenIdentifier
    email: v.string(),
    name: v.union(v.string(), v.null()),
    createdBy: v.string(), // "admin:<tokenIdentifier>"
  }).index("by_accountId", ["accountId"]),

  // Support-disabled accounts (reversible "soft delete"). The WorkOS account and
  // ALL vault data survive; while a row exists here, every owner/beneficiary-facing
  // function rejects with ACCOUNT_DISABLED (lib/account.ts). Re-enable = delete the
  // row — same identity, so the vault is reachable again. Disabling also pauses the
  // dead-man's switch (a blocked owner can't check in; an active switch would fire).
  disabledAccounts: defineTable({
    accountId: v.string(), // full tokenIdentifier; _creationTime = disabledAt
    disabledBy: v.string(), // "admin:<tokenIdentifier>"
    reason: v.optional(v.string()),
  }).index("by_accountId", ["accountId"]),

  // Single-use enrollment tokens for beneficiary keypair/account setup. Only a HASH
  // of the token is stored; the raw token is emailed once and never persisted.
  invites: defineTable({
    ownerId: v.string(),
    kind: v.literal("beneficiary"),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    tokenHash: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index("by_tokenHash", ["tokenHash"]) // redemption lookup
    .index("by_beneficiaryId", ["beneficiaryId"]),

  // Admin-managed landing-page copy (apps/landing). One row per (lang, channel):
  // "draft" is what the editor works on, "published" is what the public
  // /landing-content HTTP endpoint serves and what `astro build` fetches. The
  // checked-in dicts in @workspace/landing-content remain the build fallback.
  landingContent: defineTable({
    lang: v.union(v.literal("en"), v.literal("ar")),
    channel: v.union(v.literal("draft"), v.literal("published")),
    data: dictValidator,
    updatedBy: v.string(), // "admin:<tokenIdentifier>"
    updatedAt: v.number(), // rows are patched in place, _creationTime goes stale
    publishedAt: v.optional(v.number()), // published rows only
    lastDeployAt: v.optional(v.number()), // deploy-hook outcome (published rows)
    lastDeployOk: v.optional(v.boolean()),
  }).index("by_lang_and_channel", ["lang", "channel"]),

  // Admin-managed landing images (logo, hero photo, og image). One row per
  // channel holding the slot → storage-file map; slots are language-agnostic.
  // Files referenced by EITHER channel are kept; replacement deletes a file
  // only once nothing references it.
  landingImages: defineTable({
    channel: v.union(v.literal("draft"), v.literal("published")),
    slots: v.record(v.string(), v.id("_storage")),
    updatedBy: v.string(), // "admin:<tokenIdentifier>"
    updatedAt: v.number(),
  }).index("by_channel", ["channel"]),

  // Panel-managed integration secrets (integrationSettings.ts). A row WINS over
  // the same-named deployment env var. Values are write-only from the panel —
  // admin queries report set/not-set and never echo them back.
  integrationSettings: defineTable({
    key: v.string(), // one of integrationSettings.SETTING_KEYS (mutation-enforced)
    value: v.string(),
    updatedBy: v.string(), // "admin:<tokenIdentifier>"
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
})
