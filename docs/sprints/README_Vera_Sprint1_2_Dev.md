# Vera Developer Pack README

## What this package is
This package is the current technical handoff for Vera through the foundation work. It gives a developer enough context to understand the product direction, the technical constraints, the data model, the API contract foundation, the local setup, and the expected repository layout before implementation begins.

This is not the full product spec for all 26 sprints. It is the foundation package that supports:
- Sprint 1: Platform Foundation
- Sprint 2: Identity and Tenant Setup
- the technical standards that future sprints should follow

---

## Files included in this package

### `Sprints Detail.docx`
Primary sprint planning document.

What it contains:
- sprint-by-sprint roadmap structure
- bucket, module, phase, and executive outcomes
- Sprint 1 and Sprint 2 goals and deliverables
- platform rules for Angular, Laravel, multi-tenancy, and auditability
- the broader roadmap that continues into later sprints

How a developer should use it:
- treat this as the product roadmap and sequencing document
- use it to understand why work is ordered the way it is
- do not use it alone as the implementation source of truth because it is not detailed enough for build execution

---

### `Vera_Dev_Ready_Sprint_1_2.docx`
Short developer-ready summary for Sprint 1 and Sprint 2.

What it contains:
- Sprint 1 foundation summary
- Sprint 2 user and access control summary
- a simplified version of the first two implementation packages

How a developer should use it:
- use it as a quick orientation document before reviewing the more detailed technical pack and API spec
- use it to understand the build intent for the first two sprints at a glance

Note:
- this file is a concise summary, not the full engineering spec

---

### `VERA_Technical_Foundation_Pack.docx`
Main technical handoff document for the foundation layer.

What it contains:
- what is included in the package
- locked technical decisions
- final ERD overview
- naming conventions
- environment setup requirements
- Azure setup checklist
- local Docker development notes
- recommended frontend and backend repository structure

How a developer should use it:
- read this first after the roadmap if you are joining the project
- treat it as the implementation baseline for architecture and engineering standards
- align all new code, migrations, endpoint names, DTOs, and folder organization to this document

Key standards locked here:
- database naming uses `snake_case`
- API payload naming uses `camelCase`
- secrets stay out of source control
- Azure is the target cloud environment
- local development should run through Docker-backed services where possible

---

### `vera_openapi_foundation.yaml`
Foundation OpenAPI specification.

What it contains:
- OpenAPI version and metadata
- local and production placeholder servers
- tags for Auth, Organizations, Associations, Users, and AccessControl
- endpoint contracts for:
  - token validation
  - organizations
  - associations
  - users
  - invitations
  - association members
  - role and access foundation routes
- schema definitions for request and response payloads

How a developer should use it:
- use this as the initial API contract between frontend and backend
- use it to generate Swagger UI or import into Postman
- use it as the baseline for controller design, DTOs, validators, and response formatting
- update this file whenever endpoints, payloads, or response structures change

Implementation guidance:
- backend owns authorization and tenant enforcement
- frontend should never invent permission logic that the API does not enforce
- if the implementation differs from this file, update the spec immediately rather than letting docs drift

---

### `vera_final_erd.png`
Current foundation ERD diagram.

What it contains:
- management organization relationships
- associations and organizational ownership
- users and membership structure
- roles and role assignments
- invitation flow support
- tenant and association access relationships

How a developer should use it:
- use this as the visual data model for Sprint 1 and Sprint 2
- validate migrations, foreign keys, and model relationships against it
- confirm tenant isolation assumptions before creating new tables in later sprints

Important rule:
- future tables should follow the same tenancy strategy and relationship style unless the architecture is intentionally changed in review

---

### `docker-compose.foundation.yml`
Starter local infrastructure file.

What it contains:
- PostgreSQL service
- Redis service
- API container definition
- persistent local PostgreSQL volume

How a developer should use it:
- use this to run shared local infrastructure consistently across the team
- this is the minimum local backend support stack, not the final production infrastructure definition
- the API service expects a local `.env` file and a Dockerfile at `docker/api.Dockerfile`

Current services:
- `postgres` on port `5432`
- `redis` on port `6379`
- `api` on port `8000`

Expected local flow:
1. start infrastructure with Docker Compose
2. install backend dependencies
3. run migrations
4. install frontend dependencies
5. run Angular dev server

---

## Recommended repository structure
The technical pack defines a recommended structure. The layout below turns that into a practical starting point for a dev team.

### Backend repository: `vera-api/`
Suggested structure:

```text
vera-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Policies/
│   ├── Providers/
│   └── Services/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── associations/
│   ├── users/
│   └── access_control/
├── routes/
│   ├── api.php
│   └── web.php
├── tests/
│   ├── Feature/
│   └── Unit/
├── docker/
│   └── api.Dockerfile
├── .env.example
├── artisan
├── composer.json
└── README.md
```

Backend folder purpose:
- `app/Http/Controllers/` holds thin controllers that delegate business logic
- `app/Http/Requests/` holds request validation rules
- `app/Http/Resources/` standardizes API responses
- `app/Models/` holds Eloquent models
- `app/Policies/` holds authorization rules where appropriate
- `app/Services/` holds reusable business services
- `database/migrations/` is the source of truth for schema changes
- `modules/` keeps the modular monolith organized by domain instead of creating a giant flat codebase
- `tests/Feature/` verifies API behavior and authorization
- `tests/Unit/` verifies pure business logic
- `docker/` holds local build files

Backend implementation rules:
- use `snake_case` for tables and columns
- use UUIDs where required by the data model
- never trust tenant scope sent from the frontend without server validation
- enforce authorization in backend middleware, policies, and services
- all important changes should be auditable

---

### Frontend repository: `vera-web/`
Suggested structure:

```text
vera-web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── models/
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── associations/
│   │   │   ├── users/
│   │   │   └── access-control/
│   │   ├── layout/
│   │   └── app.routes.ts
│   ├── assets/
│   ├── environments/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

Frontend folder purpose:
- `core/` contains app-wide services and infrastructure concerns such as auth and route protection
- `shared/` contains reusable UI and helper code
- `features/` contains domain-oriented UI areas so the app scales cleanly by module
- `layout/` contains shell, nav, and page structure components
- `environments/` holds environment-specific runtime configuration

Frontend implementation rules:
- Angular is the presentation layer, not the business logic owner
- all permissions shown in the UI should come from API-backed truth
- support loading, empty, error, and success states for all data-heavy views
- keep API models in `camelCase` to match contract payloads

---

### Shared docs or platform repository: `vera-platform-docs/` or `/docs`
Suggested structure:

```text
/docs
├── architecture/
│   ├── vera_final_erd.png
│   ├── technical_decisions.md
│   └── infrastructure_overview.md
├── api/
│   ├── vera_openapi_foundation.yaml
│   └── postman/
├── sprints/
│   ├── Sprints Detail.docx
│   └── Vera_Dev_Ready_Sprint_1_2.docx
├── setup/
│   ├── local-development.md
│   ├── azure-setup.md
│   └── environment-variables.md
└── README.md
```

Docs folder purpose:
- central place for living documentation
- separates architecture and product documentation from implementation repositories
- gives new developers one place to review platform context without hunting through messages and random attachments

---

## Naming conventions
These conventions are already locked in the technical pack and should be followed everywhere.

### Database
Use `snake_case` for:
- table names
- column names
- pivot tables
- foreign keys
- migration names

Examples:
- `management_organizations`
- `association_memberships`
- `organization_id`
- `created_at`

### API payloads and frontend models
Use `camelCase` for:
- JSON request payloads
- JSON response payloads
- Angular interfaces and client-side models

Examples:
- `organizationId`
- `associationId`
- `firstName`
- `roleAssignments`

### Classes and files
Use the framework defaults:
- Laravel classes: `PascalCase`
- Angular components/services/classes: `PascalCase`
- Angular file names: kebab-case where standard Angular CLI uses it

Examples:
- `AssociationController`
- `ValidateTokenRequest`
- `users.service.ts`
- `association-list.component.ts`

---

## Environment setup expectations
The technical pack already defines the base variables. The team should create environment example files and keep secrets out of git.

### Backend `.env.example`
Expected categories:
- app config
- frontend URL
- database config
- Entra config
- Azure storage config
- cache and Redis config

Minimum backend values from the foundation pack:
- `APP_NAME`
- `APP_ENV`
- `APP_KEY`
- `APP_DEBUG`
- `APP_URL`
- `FRONTEND_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`
- `ENTRA_AUDIENCE`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `AZURE_STORAGE_CONTAINER`
- `CACHE_DRIVER`
- `REDIS_HOST`
- `REDIS_PORT`

### Frontend environment values
Expected categories:
- API base URL
- Entra client and tenant identifiers
- redirect URI

Minimum frontend values from the foundation pack:
- `apiBaseUrl`
- `entraClientId`
- `entraTenantId`
- `entraRedirectUri`

### Secret handling rules
- never commit production secrets
- use `.env.example` files as templates only
- use Azure Key Vault for staging and production secrets
- use separate local, staging, and production configurations

---

## Azure target setup
The current target cloud stack is Azure.

Expected platform resources:
- Resource Group
- Azure Database for PostgreSQL Flexible Server
- Azure App Service for backend API
- Azure App Service or Static Web App for Angular frontend
- Azure Key Vault
- Azure Storage account with blob container
- optional early Redis
- optional early Service Bus

How a developer should think about Azure in this phase:
- local Docker is for development convenience
- Azure is the deployment and operational target
- configuration and secrets should be designed so local and cloud environments stay aligned instead of becoming two different worlds

---

## Suggested onboarding order for a new developer
1. Read `Sprints Detail.docx` for roadmap context.
2. Read `VERA_Technical_Foundation_Pack.docx` for technical standards.
3. Review `vera_final_erd.png` to understand the access and tenant model.
4. Review `vera_openapi_foundation.yaml` to understand the contract.
5. Boot local services from `docker-compose.foundation.yml`.
6. Set up local `.env` files from the example values.
7. Start with Sprint 1 implementation.
8. Move to Sprint 2 only after tenant and auth foundations are stable.

That order saves a developer from doing what every team hates most: building first and discovering the rules later.

---

## Immediate gaps still worth finishing
This package is strong enough to begin foundation implementation, but a few things should still be tightened as development starts.

Recommended next documents:
- full Swagger-validated OpenAPI pass for all Sprint 1 and Sprint 2 endpoints
- migration-by-migration build order
- RBAC matrix by role and module
- API error format standard
- local setup script for one-command bootstrap
- CI/CD README for Azure deployment workflow
- test strategy README for backend and frontend

---

## Working rule for future sprints
Every future sprint package should include:
- business goal
- user stories
- acceptance criteria
- data model impact
- API changes
- permissions impact
- UI states
- testing requirements
- definition of done

That becomes the repeatable Vera build system instead of turning every sprint into interpretive dance for developers.

---

## Owner's note for the dev team
Vera is being built as a multi-tenant community and homeownership operating system for professional management companies. The foundation decisions in this package are meant to keep the platform secure, consistent, auditable, and scalable from the start.

When in doubt:
- backend is source of truth
- tenant isolation is not optional
- permissions are enforced server-side
- docs should be updated when contracts change
- clean foundations now prevent expensive rewrites later

