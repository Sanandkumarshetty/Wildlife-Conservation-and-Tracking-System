# WildLife API

Express, MySQL, and MongoDB API for the conservation app. `database/G8.sql` is the MySQL schema source of truth. The server does not execute schema, seed, migration, or destructive SQL at startup. MongoDB stores flexible field observation details linked to relational sightings.

## MySQL and environment

Use MySQL 8 with support for SRID 4326 spatial columns and the WKT `axis-order` option used by `G8.sql`. Spatial points are stored as WKT `POINT(longitude latitude)` with SRID 4326; API fields are named `latitude` and `longitude`, and the query layer converts between them.

Copy `.env.example` to `.env` and set:

```dotenv
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=wildlife_app
DB_PASSWORD=change-me
DB_NAME=wildlife_conservation
JWT_SECRET=use-a-long-random-secret
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=wildlife_conservation
```

Use a database account restricted to this schema. Do not commit `.env`. `GET /api/database/status` reads `information_schema` and runs a read-only spatial-function check to report the MySQL version and missing expected tables, columns, views, procedures, functions, and triggers. It never alters the database.

## Initial administrator

Public signup cannot create an administrator. On a fresh installation, use a trusted local terminal to generate a bcrypt hash for a password you choose:

```powershell
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('REPLACE_WITH_A_PRIVATE_PASSWORD', 12))"
```

Then, using a MySQL account authorized to create administrators, insert one account with that hash:

```sql
INSERT INTO UserAccount (full_name, email, password_hash, role)
VALUES ('System Administrator', 'admin@your-domain.example', 'PASTE_THE_GENERATED_HASH', 'ADMIN');
```

Replace both sample values before running the SQL. Keep the generated password private, and remove the terminal history if your shell records it. After signing in, an administrator can assign roles and regions through the admin pages.

## Local test accounts

`database/G8.sql` includes sample accounts, but their `password_hash` values are placeholders such as `HASH_ADMIN`, not bcrypt hashes. They cannot log in until reset. To set known local-only passwords, configure the backend `.env` for the disposable `wildlife_conservation` database, then run this from PowerShell:

```powershell
$env:NODE_ENV = 'development'
$env:ALLOW_TEST_USERS = 'true'
npm.cmd run seed:test-users
Remove-Item Env:NODE_ENV, Env:ALLOW_TEST_USERS
```

The script refuses to run unless both explicit development flags are set and `DB_NAME=wildlife_conservation`. It updates passwords only for the four matching seeded emails with their expected roles, or creates those accounts if they are absent. It hashes passwords with bcrypt cost 12, activates those accounts, and adds a first-region assignment for the ranger and researcher when a region exists. It also adds the researcher to the first `RESEARCH_INSTITUTE` when present. It does not change account roles or run `G8.sql`.

Local credentials after running the script:

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@wildlife.local` | `WildlifeAdmin!2026` |
| RANGER | `ravi.ranger@wildlife.local` | `WildlifeRanger!2026` |
| RESEARCHER | `meera.research@wildlife.local` | `WildlifeResearch!2026` |
| CITIZEN | `arjun.citizen@wildlife.local` | `WildlifeCitizen!2026` |

## Layer 1 occurrence dataset import

Place the three processed files in `backend/data/`:
`species_cleaned.csv`, `sightings_cleaned.csv`, and `sightings_sql_staging.csv`. A different directory can be supplied with `--data-dir`.

Preview first (read-only for MySQL; MongoDB is only required when applying):

```powershell
npm.cmd run import:wildlife-dataset -- --dry-run
```

Append `--full-report` to include every rejected CSV row, rather than the first ten examples.

Apply after reviewing the preview:

```powershell
npm.cmd run import:wildlife-dataset -- --apply
```

Writes are restricted to the `wildlife_conservation` database and refused when `NODE_ENV=production`. The script reuses species by scientific name, resolves regions only from a unique locality/state or a point inside one existing region boundary, and reports records it cannot place. Dry-run cannot check MongoDB occurrence duplicates, so use it to review mappings and skipped records, then apply only after confirming MongoDB is reachable. `Sighting.reported_by` is non-nullable, so the importer creates/reuses one inactive `RESEARCHER` account named `Wildlife Dataset Importer` (`wildlife-dataset-importer@wildlife.local` by default); its password is a random bcrypt hash and is never printed or usable for login. Set `DATASET_IMPORTER_EMAIL` to change that dedicated account address. Each imported sighting gets a compact occurrence marker in its description for crash recovery; flexible source and observer fields remain in MongoDB `field_observations` with both `mysql_sighting_id` and the existing API-compatible `mysqlSightingId`. Re-running skips records already linked by source occurrence ID and can repair a committed MySQL row whose Mongo insert was interrupted.

These are development test credentials only. Do not use them in a shared or production environment.

## Safe initialization

**Warning: `G8.sql` starts with `DROP DATABASE IF EXISTS wildlife_conservation`, recreates that database, inserts sample rows, and executes demonstration writes.** Never import it over a database containing data you need. The application never imports it automatically.

For a brand-new disposable local MySQL server only, first inspect the target:

```powershell
mysql -u root -p -e "SHOW DATABASES LIKE 'wildlife_conservation';"
```

If that command lists a database, stop and back it up or choose another isolated server. After reviewing the full SQL file and confirming the target has no needed data, you may manually import it once:

```powershell
mysql -u root -p < backend/database/G8.sql
```

This is intentionally a manual action. `G8.sql` names its database itself, so do not point it at a populated server. For an existing database, configure environment variables and check `/api/database/status`; resolve mismatches through a separately reviewed migration rather than re-running this file.

## Start

```powershell
cd backend
npm install
npm run dev
```

Health routes are `GET /api/health` and `GET /api/health/mongodb`. The MySQL-backed structural check is `GET /api/database/status`.

## API routes

- Auth: `POST /api/auth/register` (CITIZEN only), `POST /api/auth/login`
- Profile: `GET/PATCH /api/profile`, `POST /api/profile/password`
- Public reference: `GET /api/stats`, `/api/species`, `/api/species/:id`; homepage and wildlife catalog data only.
- Authenticated application reads: `/api/regions`, `/api/regions/boundaries`, `/api/projects`, `/api/events`, `/api/contacts`, `/api/publications`, `/api/knowledge`, `/api/sightings`. Region-scoped and privileged operations also enforce role/region rules.
- Citizen: `GET/POST /api/reports`, `GET /api/reports/:id`, `POST /api/reports/:id/evidence`, `GET /api/evidence/:id/file`, `GET/POST /api/sightings`
- Ranger/admin reports: `PATCH /api/reports/:id`, `PATCH /api/sightings/:id/status`
- Ranger investigations: `GET/POST /api/investigations`, `PATCH /api/investigations/:id`, `GET/POST /api/investigations/:id/notes`
- Ranger patrols: `GET/POST /api/patrols`, `PATCH /api/patrols/:id`, `GET/POST /api/patrols/:id/checkpoints`
- Researcher: `GET/POST /api/research/studies`, `PATCH /api/research/studies/:id`, `GET/POST /api/movements`, `GET /api/environment`
- Field observations: `GET /api/sightings/:id/field-observation` (owner/region/admin authorization), `GET /api/research/field-observations/summary` (researcher region scope or admin)
- Admin: `GET /api/analytics`, `GET /api/admin/audit`, `GET/PATCH /api/admin/users`, `POST /api/admin/species`, `GET /api/admin/species/:id/sightings` (stored procedure), region assignment routes under `/api/admin/regions/assignments`

Protected endpoints use short-lived bearer JWTs. Public registration cannot choose a role. Administrators provision ranger, researcher, and admin roles through the admin user page. Password hashes never appear in API output. Authentication requests are rate-limited. Evidence accepts JPEG/PNG/WebP/PDF files up to 5 MB each, checks basic file signatures, stores them under `backend/uploads/reports` with generated names, and requires authorization for downloads.

## Schema mapping and access

- Accounts and roles: `UserAccount`; regional assignments: `UserRegion`.
- Species catalog and wildlife records: `Species`, `Animal`, `Habitat`, `Sighting`; anonymous sightings read the existing `VerifiedWildlifeSightings` view and omit precise coordinates.
- Reports and evidence: `SuspiciousReport`, `ReportEvidence`; investigations and notes: `Investigation`, `InvestigationNote`; patrols and checkpoints: `Patrol`, `PatrolCheckpoint`.
- Research: `ResearchStudy`, `StudySpecies`, `MovementPoint`, `ResearchPublication`; institution membership: `InstitutionMember`.
- Public conservation content: `PublicConservationProjects` view backed by `ConservationProject`, plus `ProjectSpecies`, `ProjectUpdate`, `KnowledgeArticle`, `KnowledgeSource`, `EnvironmentalData`, `ConservationEvent`, and `Institution`.
- Audit: `AuditLog`, including the existing report/sighting/movement triggers.

Citizens can read and download evidence for their own reports. Rangers' report, sighting, investigation, environmental, and checkpoint access is checked against `UserRegion` and ownership. Admin routes are server-protected. The existing `GetAuthorizedReports` procedure uses the caller-provided ID, so API authorization uses the authenticated ID in a parameterized region join instead of exposing that procedure as a public operation.

The schema does not have a sighting evidence table, user notifications, soft-delete, or an emergency-contact workflow; those are not simulated. Region boundary editing and research publication editing are also not exposed. The app uses external OpenStreetMap tiles and loads Leaflet from its public CDN; an internet connection is required for map display. Decorative species photos use remote Unsplash images with a local illustration fallback.
