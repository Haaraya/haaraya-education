/* ============================================================
   Haaraya — Frontend type definitions (JSDoc)
   ----------------------------------------------------------------
   Pure documentation file. No runtime code. Use these as the
   contract every HaarayaApi.* function returns, so when we move
   to Supabase the return shapes don't drift.
   ============================================================ */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {"parent"|"teacher"|"admin"|"school_admin"} role
 * @property {string} displayName
 * @property {string} email
 * @property {number|null} schoolId
 */

/**
 * @typedef {Object} School
 * @property {number} id
 * @property {string} name
 * @property {"school"|"church"|"community"|"ngo"} type
 * @property {string} region
 */

/**
 * @typedef {Object} Child
 * @property {number} id
 * @property {string} displayName
 * @property {string} shortName
 * @property {string} avatarColor      Hex used by the initialed avatar.
 * @property {string} city
 * @property {number} currentLevelId   FK → Level.number
 * @property {"automatic"|"choose"} readingMode
 * @property {number|null} parentUserId
 * @property {number|null} schoolId
 * @property {string} startedAt        ISO date
 */

/**
 * @typedef {Object} Strand
 * @property {number} id
 * @property {string} name             "Hafwas", "Soundables", "Tafiya Fiction"…
 * @property {string} slug             "hafwas", "tafiya-fiction"…
 * @property {string} color            Hex, used for badges & seal-fills.
 * @property {string} logoUrl
 * @property {string} description
 * @property {boolean} isActive
 * @property {"reading_path"|"story_practice"|"explore"} [primaryAppZone] Annotated at boot.
 * @property {boolean} [requiresSequence]
 * @property {boolean} [countsForLevelProgressDefault]
 * @property {boolean} [isExtensionStrand]
 */

/**
 * @typedef {Object} Level
 * @property {number} number           1–12
 * @property {string} code             "L1"…"L12"
 * @property {string} name             "Tashi", "Kwari"…
 * @property {string} band             Pink / Red / Yellow / …
 * @property {"green"|"lime"|"purple"} badgeColor
 * @property {number} sortOrder
 * @property {string} description
 */

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {number} levelId          → Level.number
 * @property {number} strandId         → Strand.id
 * @property {string} code             "S-1-01"
 * @property {string} title
 * @property {string} slug
 * @property {string} bookType         "Soundable", "Hafwas Book", "Tafiya Fiction"…
 * @property {number} sequence         Position within its level/strand
 * @property {number|null} pageCount
 * @property {number|null} wordCount
 * @property {string|null} newHfw      New high-frequency word introduced.
 * @property {string|null} newPhonics
 * @property {string|null} newMorpheme
 * @property {string|null} comprehensionFocus
 * @property {string|null} reviewedHfws
 * @property {string|null} reviewedPhonics
 * @property {string|null} teachingSummary
 * @property {string} coverUrl
 * @property {string} pdfUrl
 * @property {string} audioUrl
 * @property {boolean} isActive
 * @property {string} [strandSlug]     Annotated at boot.
 * @property {string} [strandUi]       UI key: "tafiya"|"hafwas"|"soundables"|"soundables-plus"|"poetry"|"folktale"|"stamina"|"duniya".
 * @property {string} [levelCode]      "L1"…"L12" — annotated at boot.
 * @property {"reading_path"|"story_practice"|"explore"} [primaryAppZone] Annotated at boot.
 * @property {boolean} [countsForLevelProgress]
 * @property {boolean} [requiresSequence]
 * @property {boolean} [isFreeReadingAllowed]
 * @property {string|null}  [sequenceGroup]
 * @property {number|null}  [sequenceOrder]
 * @property {number|null}  [minLevelAccess]
 * @property {number|null}  [maxLevelAccess]
 */

/**
 * @typedef {Object} ReadingProgress
 * @property {number} id
 * @property {number} childId
 * @property {number} bookId
 * @property {"not_started"|"in_progress"|"completed"} status
 * @property {number} pagesRead
 * @property {string|null} completedAt
 * @property {string} updatedAt
 * @property {"assigned"|"teacher_assignment"|"parent_assignment"|"automatic_path"|"story_practice"|"free_reading"|"reread"|"extension"} [readingContext]
 * @property {boolean} [countsForProgress]
 * @property {boolean} [earnsStamp]
 */

/**
 * @typedef {Object} PassportStamp
 * @property {number} id
 * @property {number} childId
 * @property {number|null} bookId
 * @property {"book"|"level"|"strand"|"streak"|"special"|"reread"} kind
 * @property {"book"|"level"|"strand"|"reread"|"challenge"} [stampCategory]
 * @property {string} title
 * @property {string|null} strandSlug
 * @property {number|null} levelId
 * @property {string|null} [readingContext]
 * @property {string|null} [stampImageUrl]
 * @property {boolean} [isDuplicateAllowed]
 * @property {string} earnedAt
 */

/**
 * @typedef {Object} Subscription
 * @property {number} id
 * @property {"parent"|"school"|"community"} ownerType
 * @property {number} ownerId
 * @property {"reader"|"family"|"classroom"|"global"} plan
 * @property {"active"|"trial"|"past_due"|"cancelled"} status
 * @property {string} renewsOn
 * @property {number} seats
 */

/**
 * @typedef {Object} Assignment
 * @property {number} id
 * @property {number|null} bookId
 * @property {number} assignedBy        User.id of the teacher/parent
 * @property {"class"|"child"|"school"} targetType
 * @property {string|number|null} classId
 * @property {string} dueOn
 * @property {number} completedPct      0–100
 * @property {Book} [book]              Joined in by getAssignmentsForTeacher
 */

/**
 * @typedef {Object} Asset
 * @property {number} id
 * @property {"logo"|"cover"|"page"|"audio"|"stamp"|"background"} kind
 * @property {string} slug
 * @property {string} url               CDN url, never inline binary.
 */

/**
 * @typedef {Object} ChildSummary
 * @property {Child} child
 * @property {number} booksCompleted
 * @property {number} booksInProgress
 * @property {number} stampsEarned
 * @property {number} currentLevelCompleted
 * @property {number} currentLevelTotal
 * @property {number} currentLevelPct
 */
