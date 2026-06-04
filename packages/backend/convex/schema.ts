import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

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
    // Base64 PBKDF2 salt for client-side key derivation. NOT secret — the master
    // passphrase and derived key never reach the server (zero-knowledge).
    vaultSalt: v.string(),
    // Optional sentinel encrypted with the master key, used purely for a clean
    // "wrong passphrase" UX signal on unlock. No weaker than the encrypted assets
    // themselves (both are offline-attackable given the salt) — PBKDF2 iterations
    // and a strong passphrase are the real protection. Omit to rely instead on the
    // AES-GCM auth tag failing on the first real decrypt.
    passphraseVerifier: v.optional(encrypted),
    // "Two-Step" SSO vault-passphrase onboarding complete. SSO authenticates the
    // account; it NEVER unlocks the vault — the local passphrase does.
    onboardingComplete: v.optional(v.boolean()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

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
    attestationThreshold: v.optional(v.number()), // N-of-M attestations to advance/shorten grace
    longstopMs: v.optional(v.number()), // backstop auto-release if verification never comes
    pendingVerificationStartedAt: v.optional(v.number()),
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
    wrappedKey: v.string(), // DEK encrypted to beneficiary.publicKey
    algorithm: v.string(), // e.g. "RSA-OAEP-256" / "ECIES-X25519"
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
    publicKey: v.optional(v.string()), // base64, set when they enroll a keypair
    status: v.union(v.literal("invited"), v.literal("enrolled")),
    linkedUserId: v.optional(v.string()), // their own tokenIdentifier once they sign up
    label: v.optional(encrypted), // owner's private note/name for them
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_linkedUserId", ["linkedUserId"]) // a beneficiary finds vaults naming them
    .index("by_contactEmail", ["contactEmail"]), // invite/enrollment lookup

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

  // The source of "admin-ness" for the death-verification review flow. `users` has no role
  // field and apps/admin uses the same WorkOS auth as every other user, so a reviewer's
  // authority must come from somewhere explicit: membership in this server-checked allowlist.
  // The first row is seeded out-of-band (dashboard / seed mutation).
  admins: defineTable({
    tokenIdentifier: v.string(),
    addedBy: v.optional(v.string()),
    note: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // Distinct estate-administration role. May attest death + coordinate release; need not
  // receive any inheritance. Contact email plaintext (coordination/notification).
  executors: defineTable({
    ownerId: v.string(),
    contactEmail: v.string(),
    linkedUserId: v.optional(v.string()), // their own tokenIdentifier once enrolled
    scope: v.union(
      v.literal("full"),
      v.literal("debts_only"),
      v.literal("attest_only"),
      v.literal("coordinate"),
    ),
    label: v.optional(encrypted), // owner's private note/name for them
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_linkedUserId", ["linkedUserId"])
    .index("by_contactEmail", ["contactEmail"]),

  // N-of-M attestations from the owner's designated executors (the "trusted contacts").
  // Restricted to executors so eligibility derives from executors.scope ("full"/"attest_only");
  // the mutation enforces that + dedup per executor. NOTE: `note` is PLAINTEXT — an attestation
  // is authored post-mortem, when the owner's vault master key is by definition gone, so it can
  // NEVER use the `encrypted` (vault-key) envelope. Same reasoning for deathVerification.reviewNotes.
  deathAttestations: defineTable({
    ownerId: v.string(),
    executorId: v.id("executors"),
    attesterEmail: v.string(), // denormalized for audit/notify
    revokedAt: v.optional(v.number()), // attestations can be withdrawn before release
    note: v.optional(v.string()), // plaintext — no vault key exists post-mortem
  }).index("by_ownerId", ["ownerId"]),

  // The admin-reviewed certificate gate. ONE active row per owner (mutation-enforced).
  // `certificateStorageId` is the SCOPED ZERO-KNOWLEDGE EXCEPTION: legal evidence the admin
  // must read, envelope-encrypted to an ops/admin key — never the owner's vault key. The vault
  // payload itself stays untouched zero-knowledge.
  deathVerification: defineTable({
    ownerId: v.string(),
    status: v.union(
      v.literal("pending"), // awaiting certificate upload
      v.literal("under_review"), // admin is reviewing
      v.literal("approved"), // release authorized
      v.literal("rejected"), // not a valid death event
    ),
    certificateStorageId: v.optional(v.id("_storage")),
    certificateKeyAlgorithm: v.optional(v.string()), // ops-key wrap algorithm
    submittedByKind: v.optional(
      v.union(v.literal("executor"), v.literal("beneficiary")),
    ),
    submittedByEmail: v.optional(v.string()),
    reviewedBy: v.optional(v.string()), // admin tokenIdentifier
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
      v.literal("switch_state_changed"),
      v.literal("release_authorized"),
    ),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    meta: v.optional(v.record(v.string(), v.string())), // non-secret context only
  }).index("by_ownerId", ["ownerId"]),

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
    .index("by_ownerId", ["ownerId"]),

  // Single-use enrollment tokens for beneficiary AND executor keypair/account setup. Only a
  // HASH of the token is stored; the raw token is emailed once and never persisted.
  invites: defineTable({
    ownerId: v.string(),
    kind: v.union(v.literal("beneficiary"), v.literal("executor")),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    executorId: v.optional(v.id("executors")),
    tokenHash: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index("by_tokenHash", ["tokenHash"]) // redemption lookup
    .index("by_beneficiaryId", ["beneficiaryId"])
    .index("by_executorId", ["executorId"]),
})
