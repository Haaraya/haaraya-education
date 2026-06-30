# Haaraya Platform Parent, Teacher, and Admin Dashboard Addendum v1

## Purpose

This addendum defines how the parent, teacher, school admin, and Haaraya admin dashboards should work in the Haaraya Online platform. It connects the user-facing dashboard experience to the database structure so the app can be designed, prototyped, and later connected to Supabase or PostgreSQL without confusion.

This document should be used together with:

- Haaraya Website and Platform Design Brief
- Haaraya Platform Database Addendum v1
- Haaraya Platform Reading Path and Free Reading Addendum v1.1
- Haaraya sample database package

## Core Principle

Haaraya must support four adult dashboard types:

1. Parent Dashboard
2. Teacher Dashboard
3. School Admin Dashboard
4. Haaraya Admin Dashboard

Each dashboard should show only what that user is allowed to see and do. A parent should see their own children. A teacher should see their assigned classrooms. A school admin should manage the school or group. Haaraya admins should manage the full platform.

## User Roles

| Role | Main Purpose | Main Dashboard |
|---|---|---|
| Parent | Manages child profiles, subscriptions, progress, and home reading | Parent Dashboard |
| Teacher | Assigns books, monitors pupils, and supports reading progress | Teacher Dashboard |
| School Admin | Manages school account, teachers, pupils, classes, and subscription | School Admin Dashboard |
| Haaraya Admin | Manages books, levels, strands, assets, stamps, subscriptions, and platform data | Haaraya Admin Dashboard |
| Child | Reads books, earns stamps, and uses the passport | Child Dashboard |

## Parent Dashboard

### Purpose

The Parent Dashboard helps a parent manage their children, see reading progress, understand subscriptions, and support home reading without making the app feel like homework.

### Main Sections

| Section | What It Shows | Database Tables Used |
|---|---|---|
| Parent Account Summary | Parent name, email, plan, subscription status | users, subscriptions |
| Child Profiles | Each child linked to the parent | children, levels, passport_themes |
| Continue Reading | Book each child last opened or has in progress | reading_progress, books, book_pages |
| My Reading Path | Structured books for each child | assignments, books, strands, levels |
| Story Practice | Tafiya books matched to the child level | books, levels, strands, reading_progress |
| Explore for Fun | Free reading options | books, levels, strands, reading_progress |
| Reading Passport Preview | Stamps, level badges, current journey state | passport_stamps, levels, strands, assets |
| Subscription and Billing | Current plan, renewal date, child limit | subscriptions, sponsored_access |
| Parent Controls | Reading mode, child profile edits, reminders | children, users, notification_preferences |

### Parent Actions

Parents should be able to:

- Add a child profile
- Edit child display name for passport
- Choose reading mode: automatic or choose
- View child progress
- View earned stamps
- Assign or recommend books if allowed
- Turn reminders on or off
- Manage subscription
- Request sponsored or scholarship access if available

### Parent Dashboard Database Notes

Important relationships:

- One parent can have many children.
- One child can belong to one family account and optionally one school or group.
- A family subscription can cover multiple children, usually up to the plan limit.
- Parent-assigned books should be stored in `assignments` with `assignment_type = parent_assignment`.

Recommended additional table:

### `notification_preferences`

| Field | Meaning |
|---|---|
| id | Unique preference record |
| user_id | Parent or teacher account |
| child_id | Optional child-specific setting |
| reminder_type | daily_reading, weekly_summary, progress_alert |
| enabled | true or false |
| delivery_method | email, sms, push, in_app |
| preferred_time | Optional time for reminders |

## Teacher Dashboard

### Purpose

The Teacher Dashboard helps teachers assign books, track class reading, identify pupils who need support, and encourage reading without manually managing every detail.

### Main Sections

| Section | What It Shows | Database Tables Used |
|---|---|---|
| Teacher Account Summary | Teacher name, school, classrooms | users, teacher_school_links, schools |
| Classroom List | Classes/groups assigned to teacher | classrooms, classroom_children |
| Class Progress Overview | Reading progress by child and class | children, reading_progress, books, levels |
| Assignment Panel | Books assigned to class, group, or child | assignments, books, levels, strands |
| Reading Path Status | Soundables/Hafwas sequence progress | reading_progress, books, strands, levels |
| Story Practice Status | Tafiya consolidation reading | reading_progress, books, strands |
| Explore Activity | Free reading and rereads | reading_progress, books |
| Support Alerts | Children inactive, stuck, or reading below level | reading_progress, children, assignments |
| Passport View | Stamps earned by child or class | passport_stamps, assets, levels, strands |

### Teacher Actions

Teachers should be able to:

- View assigned classrooms
- View child progress by class
- Assign books to a whole class
- Assign books to a group
- Assign books to one child
- See who completed assigned books
- See who has not started
- See who is stuck in a book
- See free reading activity
- View passport stamps
- Recommend support or practice books

### Teacher Assignment Flow

1. Teacher chooses a class, group, or child.
2. Teacher filters books by level, strand, or app zone.
3. Teacher selects books.
4. System creates rows in `assignments`.
5. Books appear in the child dashboard under My Reading Path or Story Practice.
6. When child finishes the book, `reading_progress` updates.
7. If applicable, `passport_stamps` receives a new stamp record.
8. Teacher dashboard updates completion status.

### Teacher Dashboard Database Notes

Teacher assignments should use:

`assignment_type = teacher_assignment`

Recommended assignment fields:

| Field | Meaning |
|---|---|
| id | Assignment ID |
| child_id | Child receiving assignment |
| classroom_id | Optional class assignment |
| assigned_by_user_id | Teacher, parent, or system |
| book_id | Assigned book |
| assignment_type | teacher_assignment, parent_assignment, automatic_path |
| status | assigned, started, completed, skipped |
| assigned_at | Date assigned |
| due_date | Optional |

## School Admin Dashboard

### Purpose

The School Admin Dashboard is for school, church, community, or group administrators. It manages the organization account, teachers, children, classrooms, and subscription access.

### Main Sections

| Section | What It Shows | Database Tables Used |
|---|---|---|
| Organization Summary | School/group name, type, city, country | schools |
| Subscription Overview | Plan, renewal, number of children allowed | subscriptions |
| Teacher Management | Teachers linked to the school/group | users, teacher_school_links |
| Classroom Management | Classes and reading groups | classrooms |
| Pupil Management | Children linked to the school/group | children, classroom_children |
| School Progress Overview | Aggregate reading progress | reading_progress, books, levels |
| Access Management | Active, inactive, sponsored, expired users | subscriptions, sponsored_access |

### School Admin Actions

School admins should be able to:

- Add or invite teachers
- Create classrooms
- Add or import pupils
- Assign pupils to classrooms
- View school-wide progress
- Manage subscription or access status
- Remove or deactivate users
- Export progress reports if needed

### School Admin Database Notes

The existing `schools` table can represent schools, churches, communities, homeschool groups, or learning centers.

Recommended `schools.type` values:

- school
- church
- community
- homeschool_group
- library
- ngo
- other

Important rule:

Children may be linked to one school or group account for access and reporting, but their parent account remains separate. A parent can still see their own child even if the child is also linked to a school.

## Haaraya Admin Dashboard

### Purpose

The Haaraya Admin Dashboard is the internal control center for managing the full platform. This is not child-facing and does not need to feel playful. It should be clean, efficient, and safe.

### Main Sections

| Section | What It Shows | Database Tables Used |
|---|---|---|
| Book Management | All books and metadata | books, levels, strands |
| Page Management | Book pages, text, page images | book_pages, assets |
| Audio Management | Narration files and syncing | books, book_pages, assets |
| Cover and Asset Management | Logos, covers, stamps, backgrounds | assets, passport_themes |
| Level Management | 12-level journey settings | levels |
| Strand Management | Tafiya, Hafwas, Soundables, etc. | strands |
| Passport Stamp Management | Stamp assets and rules | passport_stamps, assets, books |
| Subscription Management | Paid, family, school, sponsored | subscriptions, sponsored_access |
| User Management | Parents, teachers, admins | users, children, schools |
| Reporting | Usage, reading progress, completion | reading_progress, assignments, passport_stamps |

### Haaraya Admin Actions

Haaraya admins should be able to:

- Add and edit book metadata
- Upload book covers
- Upload page images
- Upload audio files
- Set book level, strand, sequence, and app zone
- Set whether a book counts for level progress
- Manage stamp images
- Manage passport themes
- Manage subscriptions
- Manage sponsored access
- View usage reports
- Deactivate or hide books without deleting them

### Haaraya Admin Safety Rules

- Books should use `is_active = false` instead of being deleted.
- Asset files should not be deleted if they are linked to live books or stamps.
- Admin edits should be logged.
- Child progress should never be deleted casually.
- Sensitive user data should only be visible to authorized admins.

Recommended additional table:

### `admin_audit_log`

| Field | Meaning |
|---|---|
| id | Audit log ID |
| admin_user_id | Admin who made the change |
| action_type | create, update, delete, deactivate, upload |
| table_name | Table affected |
| record_id | Record affected |
| notes | Human-readable summary |
| created_at | Date and time of action |

## Child Dashboard Relationship

The child dashboard remains separate from the adult dashboards. It should focus on:

- Continue Reading
- My Reading Path
- Story Practice
- Explore for Fun
- Reading Passport
- Level Badges
- Passport Stamps

Adults manage and monitor. Children read and explore.

## Permissions Matrix

| Action | Parent | Teacher | School Admin | Haaraya Admin | Child |
|---|---|---|---|---|---|
| View own child progress | Yes | If child is in class | If child is in school/group | Yes | Own profile only |
| Add child | Yes | No | Yes, for school/group | Yes | No |
| Assign book | Optional | Yes | Optional | Yes | No |
| Read books | No | Optional preview | Optional preview | Preview | Yes |
| Manage subscription | Yes | No | Yes | Yes | No |
| Upload books/assets | No | No | No | Yes | No |
| Manage levels/strands | No | No | No | Yes | No |
| View passport stamps | Own child | Class pupils | School/group pupils | Yes | Own stamps |
| Manage teachers | No | No | Yes | Yes | No |
| Manage school account | No | No | Yes | Yes | No |

## Dashboard-to-Database Mapping

### Parent Dashboard

Uses:

- users
- children
- levels
- subscriptions
- reading_progress
- assignments
- books
- strands
- passport_stamps
- passport_themes
- notification_preferences

### Teacher Dashboard

Uses:

- users
- schools
- teacher_school_links
- classrooms
- classroom_children
- children
- assignments
- reading_progress
- books
- levels
- strands
- passport_stamps

### School Admin Dashboard

Uses:

- users
- schools
- teacher_school_links
- classrooms
- classroom_children
- children
- subscriptions
- sponsored_access
- reading_progress

### Haaraya Admin Dashboard

Uses:

- users
- children
- schools
- books
- book_pages
- levels
- strands
- assignments
- reading_progress
- passport_stamps
- passport_themes
- subscriptions
- sponsored_access
- assets
- admin_audit_log

## Data Actions and Outcomes

| User Action | Database Action | User-Facing Result |
|---|---|---|
| Parent adds child | New row in children | Child profile appears |
| Parent changes reading mode | Update children.reading_mode | Child sees automatic or choice-based path |
| Teacher assigns book | New row in assignments | Book appears in My Reading Path |
| Child starts book | Create or update reading_progress | Continue Reading updates |
| Child completes book | Update reading_progress.status | Book marked complete |
| Child earns stamp | New row in passport_stamps | Passport stamp appears |
| Admin uploads cover | New or updated asset URL | Book card updates |
| Admin deactivates book | books.is_active = false | Book hidden from library |
| School admin adds teacher | New teacher_school_links row | Teacher sees school dashboard |

## Required Frontend Data Models

The existing app should support these models:

- User
- Child
- School
- TeacherSchoolLink
- Classroom
- ClassroomChild
- Level
- Strand
- Book
- BookPage
- Assignment
- ReadingProgress
- PassportStamp
- PassportTheme
- Subscription
- SponsoredAccess
- Asset
- NotificationPreference
- AdminAuditLog

## Recommended Mock API Functions

For prototype wiring, create local mock API functions that later can be replaced with Supabase queries.

### Parent API

- getParentDashboard(userId)
- getChildrenForParent(parentUserId)
- getChildProgress(childId)
- getChildPassport(childId)
- updateChildReadingMode(childId, readingMode)
- assignBookAsParent(parentUserId, childId, bookId)

### Teacher API

- getTeacherDashboard(teacherUserId)
- getClassroomsForTeacher(teacherUserId)
- getChildrenForClassroom(classroomId)
- getClassReadingProgress(classroomId)
- assignBookToClassroom(teacherUserId, classroomId, bookId)
- assignBookToChild(teacherUserId, childId, bookId)

### School Admin API

- getSchoolDashboard(schoolId)
- getTeachersForSchool(schoolId)
- getChildrenForSchool(schoolId)
- createClassroom(schoolId, teacherUserId, name)
- addTeacherToSchool(schoolId, teacherUserId)
- addChildToClassroom(classroomId, childId)

### Haaraya Admin API

- getAllBooks()
- updateBookMetadata(bookId, updates)
- uploadBookAsset(bookId, asset)
- getAllAssets()
- updateStrand(strandId, updates)
- updateLevel(levelId, updates)
- createPassportTheme(theme)
- createSponsoredAccess(childId, details)
- deactivateBook(bookId)

## Claude or Developer Instruction

Use this instruction when handing the existing app to Claude or a developer:

```text
Do not redesign the app. Keep the existing visual direction, layout, colors, typography, and branding unless a data requirement makes a change necessary.

Update the app logic so the existing screens connect to the Haaraya dashboard and database model.

The app must support:
- Parent Dashboard
- Teacher Dashboard
- School Admin Dashboard
- Haaraya Admin Dashboard
- Child Dashboard

Use the uploaded database schema, sample data, and dashboard addendum as the binding structure.

For each dashboard, map screen sections to the correct data models and mock API functions. Replace hardcoded content with data from the sample database where possible.

Do not invent new strands, levels, book names, or platform labels.

The child-facing app should use warm labels like Continue Reading, My Reading Path, Story Practice, Explore for Fun, and Reading Passport.

Adult-facing dashboards can use clearer operational labels like Assignments, Class Progress, Subscription Status, Content Management, and User Management.
```

## Production Recommendation

This dashboard structure should be added to the main platform brief as a technical and product requirement. It is not just a design preference. The dashboards determine how Haaraya will operate for families, teachers, schools, and internal staff.

The first build should include:

1. Parent Dashboard
2. Child Dashboard
3. Teacher Dashboard
4. Basic Haaraya Admin content dashboard

The School Admin Dashboard can be simpler at launch but should be included in the database structure from the beginning so the platform does not need to be rebuilt later.
