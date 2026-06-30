/* ============================================================
   Haaraya — Sample Seed Data (in-memory mock of database rows)
   ----------------------------------------------------------------
   Mirrors the production schema. Loaded onto window.HaarayaSeed and
   consumed only via data/api.js. NEVER read directly from a screen —
   always go through HaarayaApi.* so the call site is Supabase-ready.
   ============================================================ */

window.HaarayaSeed = {
  /* ------------ Strands (loaded async from strands.json) ------------ */
  // Filled at boot by data/api.js boot()
  strands: [],

  /* ------------ Levels ------------ */
  levels: [],

  /* ------------ Books ------------ */
  books: [],

  /* ------------ Schools / orgs ------------ */
  schools: [
    { id: 1, name: "Greenfield Primary School",   type: "school",     city: "Lagos",  country: "Nigeria", website: "greenfield.ng" },
    { id: 2, name: "St. Catherine's Reading Club", type: "community",  city: "Abuja",  country: "Nigeria", website: null },
    { id: 3, name: "Kano Children's Library",      type: "library",    city: "Kano",   country: "Nigeria", website: null },
  ],

  /* ------------ Users (parent / teacher / school admin / haaraya admin) ------------ */
  users: [
    { id: 1, role: "parent",       displayName: "Mrs. Obi",          email: "obi.family@example.com",   schoolId: null },
    { id: 2, role: "teacher",      displayName: "Mrs. Adekunle",     email: "adekunle@greenfield.ng",    schoolId: 1    },
    { id: 5, role: "teacher",      displayName: "Mr. Yusuf",         email: "yusuf@greenfield.ng",       schoolId: 1    },
    { id: 6, role: "teacher",      displayName: "Mrs. Bello",        email: "bello@greenfield.ng",       schoolId: 1    },
    { id: 4, role: "school_admin", displayName: "Mr. Okoye",         email: "head@greenfield.ng",        schoolId: 1    },
    { id: 3, role: "admin",        displayName: "Haaraya Admin",     email: "admin@haaraya.org",         schoolId: null },
  ],

  /* ------------ Teacher-school links ------------ */
  teacherSchoolLinks: [
    { id: 1, teacherUserId: 2, schoolId: 1, role: "lead_teacher",   startedOn: "2025-01-08" },
    { id: 2, teacherUserId: 5, schoolId: 1, role: "subject_teacher", startedOn: "2025-09-02" },
    { id: 3, teacherUserId: 6, schoolId: 1, role: "subject_teacher", startedOn: "2025-09-02" },
  ],

  /* ------------ Classrooms ------------ */
  classrooms: [
    { id: 1, schoolId: 1, name: "Primary 3B",       grade: "Primary 3", primaryTeacherId: 2, term: "Term 2", year: "2026" },
    { id: 2, schoolId: 1, name: "Primary 4A",       grade: "Primary 4", primaryTeacherId: 5, term: "Term 2", year: "2026" },
    { id: 3, schoolId: 1, name: "Primary 1 Tigers", grade: "Primary 1", primaryTeacherId: 6, term: "Term 2", year: "2026" },
  ],

  /* ------------ Children (demo profiles per Schema Readme) ------------ */
  children: [
    { id: 1, displayName: "Kahamefule Obi",   shortName: "Kaha",     avatarColor: "#E65100", city: "Lagos", currentLevelId: 7,  readingMode: "automatic", parentUserId: 1, schoolId: null, startedAt: "2025-01-18" },
    { id: 2, displayName: "Amaka Obi",        shortName: "Amaka",    avatarColor: "#1565C0", city: "Lagos", currentLevelId: 3,  readingMode: "choose",    parentUserId: 1, schoolId: null, startedAt: "2025-03-02" },
    { id: 3, displayName: "Nasa Eze",         shortName: "Nasa",     avatarColor: "#228B22", city: "Abuja", currentLevelId: 1,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-04-10" },
    { id: 4, displayName: "Chinyere Adekunle", shortName: "Chinyere", avatarColor: "#8E24AA", city: "Lagos", currentLevelId: 5,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-02-01" },
    { id: 5, displayName: "Tunde Bello",      shortName: "Tunde",    avatarColor: "#5D4037", city: "Lagos", currentLevelId: 4,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-02-04" },
    { id: 6, displayName: "Bisi Adigun",      shortName: "Bisi",     avatarColor: "#283593", city: "Lagos", currentLevelId: 6,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-01-22" },
    { id: 7, displayName: "Femi Ola",         shortName: "Femi",     avatarColor: "#00838F", city: "Lagos", currentLevelId: 3,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-03-12" },
    { id: 8, displayName: "Tobi Amobi",       shortName: "Tobi",     avatarColor: "#1565C0", city: "Abuja", currentLevelId: 2,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-04-04" },
    { id: 9, displayName: "Adaeze Okonkwo",   shortName: "Adaeze",   avatarColor: "#BF360C", city: "Lagos", currentLevelId: 8,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2024-09-12" },
    { id: 10, displayName: "Sade Oyelade",    shortName: "Sade",     avatarColor: "#7CB342", city: "Lagos", currentLevelId: 5,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-02-18" },
    { id: 11, displayName: "Ngozi Inyang",    shortName: "Ngozi",    avatarColor: "#F5C518", city: "Lagos", currentLevelId: 4,  readingMode: "automatic", parentUserId: null, schoolId: 1, startedAt: "2025-02-22" },
  ],

  /* ------------ Classroom rosters ------------ */
  classroomChildren: [
    // Primary 3B (Mrs. Adekunle) — 7 pupils
    { classroomId: 1, childId: 3 }, { classroomId: 1, childId: 4 },
    { classroomId: 1, childId: 5 }, { classroomId: 1, childId: 6 },
    { classroomId: 1, childId: 7 }, { classroomId: 1, childId: 10 },
    { classroomId: 1, childId: 11 },
    // Primary 4A (Mr. Yusuf)
    { classroomId: 2, childId: 9 },
    // Primary 1 Tigers (Mrs. Bello)
    { classroomId: 3, childId: 8 },
  ],

  /* ------------ Reading progress (rows generated at boot) ------------ */
  readingProgress: [], // filled by api.boot() from books + demo seed

  /* ------------ Passport stamps (also generated at boot) ------------ */
  passportStamps: [],

  /* ------------ Subscriptions ------------ */
  subscriptions: [
    { id: 1, ownerType: "parent", ownerId: 1, plan: "family",    status: "active", renewsOn: "2026-08-14", seats: 4 },
    { id: 2, ownerType: "school", ownerId: 1, plan: "classroom", status: "active", renewsOn: "2026-09-01", seats: 60 },
  ],

  /* ------------ Sponsored access (Haaraya admin can grant scholarship seats) ------------ */
  sponsoredAccess: [
    { id: 1, childId: 8,  sponsorName: "Haaraya Foundation",    coversUntil: "2026-12-31", note: "Diaspora donor pool" },
    { id: 2, childId: 11, sponsorName: "Greenfield PTA Fund",   coversUntil: "2026-08-31", note: "Term scholarship" },
  ],

  /* ------------ Notification preferences ------------ */
  notificationPreferences: [
    { id: 1, userId: 1, childId: null, reminderType: "daily_reading",  enabled: true,  deliveryMethod: "push",   preferredTime: "18:30" },
    { id: 2, userId: 1, childId: null, reminderType: "weekly_summary", enabled: true,  deliveryMethod: "email",  preferredTime: "Sun 09:00" },
    { id: 3, userId: 1, childId: 1,   reminderType: "progress_alert", enabled: false, deliveryMethod: "email",  preferredTime: null },
  ],

  /* ------------ Assignments (teacher → class) ------------ */
  assignments: [
    { id: 1, bookId: null, assignedBy: 2, targetType: "class", classroomId: 1, childId: null, assignmentType: "teacher_assignment", status: "completed",   assignedAt: "2026-05-12", dueOn: "2026-05-30", completedPct: 100 },
    { id: 2, bookId: null, assignedBy: 2, targetType: "class", classroomId: 1, childId: null, assignmentType: "teacher_assignment", status: "started",     assignedAt: "2026-05-18", dueOn: "2026-06-04", completedPct: 75  },
    { id: 3, bookId: null, assignedBy: 2, targetType: "class", classroomId: 1, childId: null, assignmentType: "teacher_assignment", status: "started",     assignedAt: "2026-05-20", dueOn: "2026-06-04", completedPct: 64  },
    { id: 4, bookId: null, assignedBy: 2, targetType: "class", classroomId: 1, childId: null, assignmentType: "teacher_assignment", status: "assigned",    assignedAt: "2026-05-24", dueOn: "2026-06-11", completedPct: 0   },
    { id: 5, bookId: null, assignedBy: 2, targetType: "class", classroomId: 1, childId: null, assignmentType: "teacher_assignment", status: "completed",   assignedAt: "2026-05-04", dueOn: "2026-05-23", completedPct: 100 },
  ],

  /* ------------ Passport themes (cover variations) ------------ */
  passportThemes: [
    { id: 1, name: "Forest Green",  coverUrl: "assets/passport-cover.png", isDefault: true },
  ],

  /* ------------ Reusable assets ------------ */
  assets: [
    { id: 1,  kind: "logo",    slug: "haaraya-education",  url: "assets/logo-haaraya-education.png" },
    { id: 2,  kind: "logo",    slug: "haaraya-literacy",   url: "assets/logo-haaraya-literacy.png"  },
    { id: 3,  kind: "logo",    slug: "tafiya",             url: "assets/logo-tafiya.png"            },
    { id: 4,  kind: "logo",    slug: "hafwas",             url: "assets/logo-hafwas.png"            },
    { id: 5,  kind: "logo",    slug: "soundables",         url: "assets/logo-soundables.png"        },
    { id: 6,  kind: "logo",    slug: "soundables-plus",    url: "assets/logo-soundables-plus.png"   },
    { id: 7,  kind: "logo",    slug: "tafiya-poetry",      url: "assets/logo-poetry.png"            },
    { id: 8,  kind: "logo",    slug: "tafiya-folktale",    url: "assets/logo-folktales.png"         },
    { id: 9,  kind: "logo",    slug: "tafiya-stamina",     url: "assets/logo-tafiya-stamina.png"    },
    { id: 10, kind: "logo",    slug: "tafiya-duniya",      url: "assets/logo-tafiya-duniya.png"     },
    { id: 11, kind: "cover",   slug: "passport-cover",     url: "assets/passport-cover.png"          },
    { id: 12, kind: "background", slug: "passport-bg",     url: "assets/passport-bg.png"             },
  ],

  /* ------------ Admin audit log (recent actions) ------------ */
  adminAuditLog: [
    { id: 1, adminUserId: 3, actionType: "update",     tableName: "books",       recordId: 12, notes: "Updated cover for 'Sun'",       createdAt: "2026-05-22 09:14" },
    { id: 2, adminUserId: 3, actionType: "create",     tableName: "passport_themes", recordId: 1, notes: "Added Forest Green theme",  createdAt: "2026-05-20 16:02" },
    { id: 3, adminUserId: 3, actionType: "deactivate", tableName: "books",       recordId: 188, notes: "Hid duplicate Hafwas book",   createdAt: "2026-05-18 11:55" },
    { id: 4, adminUserId: 3, actionType: "upload",     tableName: "assets",      recordId: 11, notes: "Uploaded new passport cover",  createdAt: "2026-05-15 14:30" },
  ],
};
