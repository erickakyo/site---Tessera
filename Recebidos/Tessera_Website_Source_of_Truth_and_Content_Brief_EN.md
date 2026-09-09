# TESSERA
## Website Source of Truth & Content Brief
### English version for website generation

**Purpose of this document**

This document is the source of truth for creating the Tessera website. It consolidates the current technical decks, product maturity, architecture discussions, product positioning, use cases, and the key clarifications made during product discussions.

It is designed to be given directly to a website developer or to an AI coding assistant such as Claude.

---

# 1. NON-NEGOTIABLE INSTRUCTIONS FOR THE WEBSITE

## 1.1 Do not present Tessera as a linear pipeline

This is the most important architecture rule.

**Discovery, Masking, Subsetter, and CDC & Snapshot are modular capabilities. They are not mandatory sequential stages of a single pipeline.**

In particular:

- CDC & Snapshot does **not** require Discovery.
- CDC & Snapshot does **not** require Masking.
- CDC & Snapshot does **not** require Subsetter.
- Discovery can be used independently.
- Masking is a reusable framework and can be consumed by other applications/workflows.
- Subsetter can embed Discovery and Masking during extraction.
- CDC & Snapshot is an independent producer of snapshot and incremental change data.
- The future Database Operator / Data Environment Lifecycle layer may consume data delivered through Subsetter or CDC, masked or unmasked depending on the use case.

**Do not draw this:**

```text
Discovery -> Masking -> Subsetter -> CDC
```

That implies dependencies that do not exist.

A better conceptual model is:

```text
                         DATA SOURCES
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
       DISCOVERY         SUBSETTER       CDC & SNAPSHOT
       framework         application       application
            │                │                │
            │                │                └──> JSONL / S3 / filesystem
            │                │
            └──> inventory   ├──> referentially consistent subset
                    │        │
                    ▼        │
                 MASKING <───┘
                 framework
                 (reusable / optional by workflow)
```

The diagram should visually communicate **composability**, not a mandatory sequence.

---

# 2. PRODUCT SOURCE OF TRUTH

Tessera currently consists of four implemented technical modules plus one planned lifecycle layer:

1. **Discovery**
2. **Masking**
3. **Subsetter**
4. **CDC & Snapshot**
5. **Database Operator / Data Environment Lifecycle** — roadmap

The current technical architecture describes Discovery and Masking as reusable frameworks, Subsetter and CDC as data-producing applications, and the future database operator as the orchestration/lifecycle layer for non-production replicas.

---

# 3. PRODUCT MATURITY — MUST BE ACCURATE

| Product / Module | Website Status | Current Reality |
|---|---|---|
| Discovery | **READY** | Mature / in use; additional classifiers and domain tuning remain ongoing |
| Masking | **READY** | Mature / in use; additional algorithms can continue to be added |
| Subsetter | **READY — CORE COMPLETE** | Web, CLI and Kubernetes surfaces implemented; hardening/throughput work remains |
| CDC & Snapshot | **AVAILABLE — HARDENING** | Core delivered for PostgreSQL/MySQL; observability, timeouts and CI hardening remain |
| Database Operator / Data Environment Lifecycle | **ROADMAP / PLANNED** | Conceptual scope; not yet implemented |

**Never present the Database Operator or complete Data Environment Lifecycle as available today.**

---

# 4. COMPANY / PLATFORM POSITIONING

## Recommended category

**Data Environment Automation**

This is a strategic positioning, not an assertion that the full environment lifecycle is already implemented.

Tessera is building toward automating the data layer of engineering environments: discovering sensitive data, protecting it, reducing it to useful subsets, capturing changes, and eventually automating the lifecycle of isolated non-production database environments.

## Recommended core proposition

> **Production-like data. Without production risk.**

## Supporting proposition

> **Secure, realistic data for development, testing, analytics, migration and AI-assisted engineering.**

## Strategic narrative

Software engineering has progressively automated:

- source control;
- CI/CD;
- infrastructure provisioning;
- Kubernetes;
- testing;
- and, increasingly, software generation through AI.

But data environments are still frequently created through:

- full production copies;
- manual exports;
- scripts;
- support tickets;
- shared databases;
- outdated datasets;
- partially protected sensitive data.

Tessera addresses this gap.

## Recommended strategic message

> **Software became automated. Infrastructure became automated. Data environments are next.**

Alternative:

> **Bring data environments into the automation era.**

---

# 5. WHAT TESSERA IS — AND WHAT IT IS NOT

## Tessera is

- A platform for sensitive-data discovery.
- A deterministic data-masking framework.
- A referential data-subsetting engine.
- A snapshot and Change Data Capture engine.
- A set of Web, CLI and Kubernetes-friendly capabilities for engineering workflows.
- A foundation for future automated non-production data environments.

## Tessera is not currently

- A data catalog.
- A semantic layer.
- A data-quality remediation platform.
- A RAG platform.
- An AI-agent framework.
- A vector database.
- A knowledge-graph product.
- A generic database migration product with a universal target-side applier.
- A complete database cloning/lifecycle platform today.
- A dynamic data-masking proxy.

AI is an important **consumer/use case**, not the definition of the platform.

---

# 6. PRODUCT 1 — DISCOVERY

## Status

**READY**

## Website headline

> **Know where sensitive data lives.**

## One-line description

Tessera Discovery classifies sensitive fields from metadata and data samples and produces a reusable inventory for protection workflows.

## Product purpose

Discovery identifies columns or JSON paths that likely contain sensitive information.

Typical inputs include:

- column names;
- JSON paths;
- data types;
- metadata;
- data samples.

Conceptual output:

```text
customers.cpf
domain: brazilian_tax_id
recommended_algorithm: CPF masking
confidence: high

customers.email
domain: email
recommended_algorithm: Email masking
confidence: high
```

## Architecture

Discovery is a **Go library/framework with no direct I/O**.

It does not itself connect to a database or object store.

Instead:

```text
Consumer application
        ↓
column/path metadata + samples
        ↓
Tessera Discovery
        ↓
classification inventory
```

This makes the framework portable and reusable by different consumers.

## Classifier types

The technical implementation includes classifiers based on:

- type;
- path / regex;
- data / regex;
- Luhn validation;
- dictionary;
- entropy.

The classifier framework is extensible.

## Key design principles

### Independent PATH and DATA classification

PATH and DATA can classify independently.

This is important for:

- SAP-like schemas;
- legacy systems;
- localized column names;
- obfuscated field names.

For example:

```text
FLD_019
ZZ_FIELD
ATTR_004
```

may reveal nothing through the name, while data values can still indicate an email, payment card, CPF or another sensitive domain.

### Recall-first strategy

Discovery prioritizes reducing the chance that sensitive fields are missed.

Ambiguous classifications can be flagged for human review.

### Deterministic output

The same inputs produce stable classification results, enabling inventory diffs and regression testing.

### Unified relational and JSON model

Relational columns and JSON values are represented through paths rather than requiring separate classification engines.

### Empirical evaluation

A labeled-corpus harness calculates:

- precision;
- recall;
- F1;

by data domain.

## Recommended website copy

> **Discover sensitive data before it reaches non-production.**
>
> Tessera analyzes schema metadata and representative values to classify sensitive fields and create a consistent inventory that downstream workflows can use for protection and review.

## Good use cases

- PII inventory for DEV / QA / HML.
- Detecting sensitive fields in legacy systems.
- Preparing masking policies.
- Reviewing third-party or partner datasets.
- Identifying sensitive information before non-production delivery.

## Important claim rule

Do **not** say:

> "Tessera detects 100% of PII."

Discovery is a classification system and can have false positives and false negatives.

---

# 7. PRODUCT 2 — MASKING

## Status

**READY**

## Website headline

> **Protect sensitive data without breaking relationships.**

## One-line description

Tessera Masking transforms sensitive values deterministically so applications can keep realistic structure and referential consistency without exposing the original values.

## Core principle

```text
same key
+ same configuration
+ same input
= same masked output
```

This allows the same original identifier to remain consistent across multiple occurrences.

Example:

```text
customers.customer_id -> masked value X
payments.customer_id  -> masked value X
support.customer_id   -> masked value X
```

The original relationship survives while the source value is protected.

## Technical characteristics

The current technical material includes:

- deterministic key-driven masking;
- FF1 format-preserving encryption capability;
- SHA-256;
- protected key providers;
- AWS KMS;
- file / Kubernetes Secret provider;
- thread-safe execution;
- algorithm chaining;
- cycle detection;
- multiple masking algorithms.

## Algorithm examples

Current examples include:

- Secure Lookup;
- Character Mapping;
- Numeric Mapping;
- Segment Mapping;
- Date Shift;
- Date Replacement;
- Full Name;
- Email.

The technical material also references format-valid handling for:

- payment cards / Luhn;
- IBAN;
- checksum-based identifiers such as CPF/CNPJ.

## Static masking

The current masking model is primarily **static masking**:

- transformed values are written into the destination dataset/environment;
- original values are not preserved in that destination.

This is appropriate for use cases such as:

- development;
- QA;
- staging;
- analytics datasets where real identities are unnecessary;
- third-party datasets;
- non-production environments.

## Not currently dynamic masking

The current product should not be marketed as a dynamic masking layer that preserves original data on disk and changes what individual users see at query time.

## Recommended website copy

> **Keep realistic structure. Remove unnecessary exposure.**
>
> Tessera applies deterministic, format-aware transformations so related records remain consistent across tables and repeated executions while sensitive values are protected.

## Good use cases

- DEV / QA database refreshes.
- Analytics sandboxes.
- Secure datasets for contractors.
- Integration testing.
- Repeatable test fixtures derived from realistic data.
- Cross-table pseudonymous identifiers.

---

# 8. PRODUCT 3 — SUBSETTER

## Status

**READY — CORE COMPLETE**

## Website headline

> **Move the data you need. Keep the relationships you depend on.**

## One-line description

Tessera Subsetter creates smaller datasets from large source systems while preserving the relationships needed for development, testing and analytical work.

## Problem

Teams often do not need an entire multi-terabyte production database.

They need a useful slice such as:

```text
selected customers
+ accounts
+ payments
+ transactions
+ orders
+ support records
```

The challenge is preserving the relationships between those records.

## Architecture

```text
Sources
   ↓
Schema Graph
   ↓
Planner
   ↓
Executor
   ↓
Referentially consistent subset
```

## Schema Graph

The schema graph uses Neo4j and can represent:

- tables;
- columns;
- physical foreign keys;
- logical relationships;
- inferred relationships;
- cross-database relationships.

Logical relationships are important because real systems frequently contain dependencies that are not declared as database foreign keys.

## Planner

The planner uses Tarjan strongly connected components (SCC) to identify cycles.

Example:

```text
A depends on B
B depends on C
C depends on A
```

The planner can organize execution in waves to handle dependencies and parallel execution.

## Seed / filter-driven subsetting

Subsets may originate from criteria such as:

```text
country = BR
customer_id = 123
created_at >= selected date
```

The engine then follows relevant relationships.

## Discovery and Masking integration

Subsetter can execute Discovery and Masking during extraction.

This is an **integration option**, not evidence that Discovery and Masking are mandatory prerequisites for all Tessera products.

## Supported platforms

The current technical material lists:

- PostgreSQL;
- MySQL;
- SQL Server;
- Oracle;
- MongoDB;
- Object Storage (S3 / Azure).

PostgreSQL declarative partitioned tables can be treated as logical units with partition-aware reading.

**DynamoDB is specified but not implemented.**

## Interfaces

### Web

- React UI;
- REST API;
- connector configuration;
- graph UI;
- asynchronous jobs;
- progress through SSE;
- PostgreSQL metadata store.

### CLI / Headless

Current execution surfaces include:

```text
subsetter-job
subsetter-discover
```

with YAML-driven configuration.

Good for:

- CI/CD;
- GitHub Actions;
- GitLab;
- Jenkins;
- Azure DevOps;
- scheduled automation;
- engineering pipelines.

### Kubernetes

Current custom resources include:

- `SubsetJob`
- `DiscoveryJob`

The implementation uses controller-runtime and works with Kubernetes Secrets and ConfigMaps.

## Recommended website copy

> **Stop copying everything just to test one thing.**
>
> Tessera creates smaller, referentially consistent datasets from complex source systems and can apply sensitive-data discovery and masking as part of the extraction workflow.

## Good use cases

- Test data provisioning.
- Per-team datasets.
- Data Engineering sandboxes.
- Migration testing.
- Incident reproduction.
- Analytics sandboxes.
- CI/CD integration tests.
- Vendor / partner datasets.

---

# 9. PRODUCT 4 — CDC & SNAPSHOT

## Status

**AVAILABLE — HARDENING**

## Website headline

> **Capture a consistent starting point. Keep up with what changes next.**

## One-line description

Tessera CDC & Snapshot combines a consistent initial snapshot with commit-ordered incremental change capture and writes canonical event data to object storage or filesystem.

## Critical dependency rule

**CDC is an independent capability.**

It does not require:

- Discovery;
- Masking;
- Subsetter.

Do not show those modules as mandatory upstream stages.

Depending on the use case, CDC may be used independently or integrated with other Tessera capabilities.

## Current source support

- PostgreSQL 16+.
- MySQL 8+.

## Current destination/output

- canonical JSONL;
- Amazon S3;
- filesystem.

## Architecture

```text
PostgreSQL / MySQL
        │
        ▼
    Coordinator
        │
   ┌────┴────┐
   │         │
Snapshot   Stream
   │         │
   └────┬────┘
        │
        ▼
Canonical JSONL
        │
        ▼
S3 / filesystem
```

## Core characteristics

### Coordinated snapshot and stream

The coordinator establishes the boundary between:

- the initial state captured by snapshot;
- the changes captured after that point.

For PostgreSQL, the architecture uses an LSN boundary.

Conceptually:

```text
before LSN0 -> snapshot
LSN0 onward -> stream
```

The design aims to avoid transaction gaps between the initial snapshot and the subsequent change stream.

### MVCC-consistent snapshot

The snapshot provides a consistent view while the source database remains active.

### Commit ordering

Incremental changes are serialized in commit order.

### Effectively-once behavior

The current design combines:

- at-least-once delivery;
- deterministic/idempotent writes;
- storage markers as the source of truth.

### Canonical serialization

The output is designed to be byte-stable/replay-friendly:

- stable field ordering;
- numeric normalization;
- ISO-8601;
- base64 where required.

### DDL capture

Events can include:

- CREATE;
- ALTER;
- DROP;

represented as DDL records.

### Re-snapshot

The platform includes re-snapshot support.

### PostgreSQL engine

Uses PostgreSQL logical replication / pgoutput without requiring a source-side extension.

### MySQL engine

Uses MySQL row binlog / GTID.

## Kubernetes

The technical material lists four CRDs:

- `CaptureSource`
- `ReSnapshot`
- `CaptureDestination`
- `CaptureClass`

## What is still being hardened

The roadmap identifies work such as:

- observability metrics;
- per-operation timeouts;
- MySQL CI parity;
- further operational hardening.

## Recommended website copy

> **Continuous database change capture without requiring a full event-streaming stack.**
>
> Tessera coordinates an initial consistent snapshot with incremental change capture and writes replayable canonical events to S3 or filesystem for migration, engineering and data-platform workflows.

## Good current use cases

- Database-to-object-storage change capture.
- Lake / lakehouse ingestion.
- Migration staging.
- Audit / replay-oriented change archives.
- Data Engineering pipelines.
- Incremental data export.

## Claim limitations

Do not claim that Tessera currently provides:

- a universal target-side database applier;
- generic automatic database-to-database migration;
- a complete synchronized clone environment for every engine.

Those capabilities are not established by the current product material.

---

# 10. PRODUCT 5 — DATABASE OPERATOR / DATA ENVIRONMENT LIFECYCLE

## Status

**ROADMAP / PLANNED — NOT CURRENTLY AVAILABLE**

## Website section label

Use:

> **Roadmap**

or

> **Our Vision**

Do not use:

> **Available Now**

## Recommended headline

> **An isolated data environment for every developer, pipeline and agent.**

## Vision

The planned lifecycle layer is intended to manage non-production database replicas and isolated environments through Kubernetes.

Conceptual architecture:

```text
Production sources
        │
        ▼
Subsetter OR CDC
(masked or unmasked depending on use case)
        │
        ▼
Intermediate non-production replica
        │
        ▼
      Clones
   ┌────┼────┐
   │    │    │
 Dev   Test  AI
```

## Planned lifecycle operations

- provision;
- refresh;
- snapshot;
- rollback.

The broader product vision can also include clone creation and environment destruction, but the currently documented roadmap explicitly highlights provision, refresh, snapshot and rollback.

## Planned storage direction

Current concepts include:

- block storage;
- Amazon EFS;
- OCI ZFS appliance;
- extensible storage integration.

## Important architecture principle

Tessera does not necessarily need to replace mature database-specific operators.

A potential strategic architecture is for Tessera to become the **data-environment control plane** above database/storage mechanisms:

```text
                   Tessera Control Plane
                           │
          ┌────────────────┼────────────────┐
          │                │                │
 database operator   cloud snapshots   storage APIs
          │                │                │
          └────────────────┼────────────────┘
                           │
                     isolated environments
```

This is a strategic direction and should not be presented as implemented functionality.

---

# 11. PLATFORM ARCHITECTURE — CORRECT WEBSITE VIEW

The website should show a **capability architecture**, not a single mandatory pipeline.

Recommended conceptual diagram:

```text
                                DATA SOURCES
                    ┌──────────────┼───────────────┐
                    │              │               │
                    ▼              ▼               ▼
              DISCOVERY        SUBSETTER      CDC & SNAPSHOT
              reusable          data            data
              framework         producer         producer
                    │              │               │
                    │              │               └──> JSONL / S3 / FS
                    │              │
                    ▼              └──> Subset datasets
               Inventory
                    │
                    ▼
                MASKING
              reusable framework
                    │
                    └──> can be used by compatible workflows

Future orchestration:
Subsetter output OR CDC-based replica
                    ↓
        DATA ENVIRONMENT LIFECYCLE
                    ↓
     Dev / QA / Data / Analytics / AI
```

## Alternative simple marketing visual

```text
Discover     Protect     Subset     Capture
   │            │          │           │
   └────────────┴──────────┴───────────┘
             COMPOSABLE CAPABILITIES
                      │
                      ▼
     Engineering | Data | QA | Analytics | AI
```

Then a separate "Roadmap" visual:

```text
Safe data / replicas
        ↓
Data Environment Lifecycle
        ↓
Provision | Refresh | Snapshot | Rollback
```

---

# 12. PRIMARY WEBSITE USE CASES

Tessera should not be marketed only around AI.

The same platform applies to several engineering and data problems.

---

# 13. USE CASE — SECURE TEST DATA

## Headline

> **Production-like test data without production exposure.**

## Problem

DEV, QA and HML frequently depend on:

- production database copies;
- stale shared datasets;
- manual DBA refreshes;
- incomplete masking;
- artificial test data that misses realistic relationships.

## Tessera fit

```text
Production source
       ↓
Subsetter
       ↓
optional Discovery / Masking
       ↓
DEV / QA dataset
```

Discovery and Masking may be applied as part of the workflow where sensitive-data protection is required.

## Outcomes to communicate

- smaller datasets;
- referential integrity;
- reduced sensitive-data exposure;
- repeatability;
- pipeline automation.

---

# 14. USE CASE — DATA ENGINEERING SANDBOX

## Headline

> **Build pipelines against realistic data without touching production.**

## Example

```text
Source database
       ↓
Subsetter
       ↓
protected / focused dataset
       ↓
Data Engineering Sandbox
       ↓
Bronze -> Silver -> Gold
```

## Applications

- ingestion development;
- transformation testing;
- data contracts;
- Data Quality rule development;
- performance testing;
- schema validation;
- new data-product development.

Tessera does **not** fix bad source-data quality. It provides a safer environment in which teams can observe realistic source behavior and build/test their data logic.

---

# 15. USE CASE — INCIDENT REPRODUCTION

## Headline

> **Turn production incidents into reproducible test scenarios.**

## Example

```text
Incident / customer / transaction
            ↓
          Seed
            ↓
        Subsetter
            ↓
optional masking
            ↓
reproducible safe dataset
            ↓
Debug -> Fix -> Regression Test
```

## Business value

- lower time to reproduce;
- lower production access;
- more reliable regression testing;
- lower MTTR.

The future Data Environment Lifecycle layer could make this even stronger by creating short-lived isolated database environments automatically.

---

# 16. USE CASE — MIGRATION & MODERNIZATION

## Headline

> **Keep data moving while your platform changes.**

## Relevant transformations

- on-premises to cloud;
- database modernization;
- ERP modernization;
- application replatforming;
- lakehouse ingestion;
- legacy decommissioning;
- repeated migration testing.

## Current Tessera contribution

CDC currently supports:

```text
PostgreSQL / MySQL
        ↓
consistent snapshot
        +
incremental CDC
        ↓
canonical JSONL
        ↓
S3 / filesystem
```

Subsetter can independently support repeatable reduced datasets for migration tests.

These are separate capabilities and can be combined where useful.

## Important wording

Do not say:

> "Tessera automatically migrates any database to any target."

A generic target-side applier is not currently established.

---

# 17. USE CASE — ANALYTICS SANDBOX

## Headline

> **Give analysts realistic data, not direct production access.**

## Value

Teams can create safer subsets for:

- exploration;
- prototyping;
- analytical development;
- metric testing;
- investigation.

## Product boundary

Tessera is not a replacement for:

- Atlan;
- Alation;
- Collibra;
- Microsoft Purview;
- a semantic layer;
- enterprise data governance.

---

# 18. USE CASE — SECURITY & PRIVACY

## Headline

> **Reduce sensitive-data exposure outside production.**

## Relevant capabilities

- sensitive-data Discovery;
- deterministic Masking;
- Subsetting / data minimization;
- safe dataset delivery.

## Typical situations

- DEV and QA refreshes;
- contractor access;
- external development partners;
- analytics sandboxes;
- migration projects;
- support / incident analysis.

## Important compliance language

Do not claim that "masked data is automatically outside LGPD/GDPR."

The website should describe technical protection capabilities without making blanket legal guarantees.

Use language such as:

> **Support privacy-by-design practices by reducing unnecessary exposure of sensitive data in non-production workflows.**

---

# 19. USE CASE — AI-ASSISTED ENGINEERING

## Headline

> **Give AI-assisted engineering realistic data without giving it production access.**

## Context

AI has accelerated:

- code generation;
- test generation;
- debugging;
- infrastructure automation.

But agents and developers still need realistic data structures and edge cases to validate software.

## Tessera role

Tessera can provide:

- smaller realistic datasets;
- masked sensitive data;
- reproducible inputs;
- database changes through CDC;
- future isolated data environments.

## Product boundary

Tessera is **not** currently:

- a coding agent;
- an agent orchestrator;
- a RAG solution;
- a context-engineering platform.

AI is a consumer of Tessera data environments.

---

# 20. TARGET PERSONAS

## Software Engineering

Problems:

- waiting for test data;
- shared QA state;
- poor mocks;
- difficult incident reproduction.

Relevant Tessera capabilities:

- Subsetter;
- Masking;
- future Data Environment Lifecycle.

## Data Engineering / Data Platform

Problems:

- pipeline development against production;
- unrealistic DEV data;
- testing migrations;
- incremental ingestion.

Relevant capabilities:

- Subsetter;
- CDC & Snapshot;
- Discovery / Masking where needed.

## QA / Quality Engineering

Problems:

- non-repeatable data;
- weak regression datasets;
- environment contention;
- sensitive production copies.

Relevant capabilities:

- Subsetter;
- Masking;
- future isolated environments.

## Database / Platform Engineering

Problems:

- refresh operations;
- database copies;
- migration;
- synchronization;
- self-service demand.

Relevant capabilities:

- CDC & Snapshot;
- Subsetter;
- future lifecycle layer.

## Security / Privacy / DPO

Problems:

- unknown PII in non-production;
- uncontrolled copies;
- contractor datasets;
- inconsistent masking.

Relevant capabilities:

- Discovery;
- Masking;
- Subsetter.

## Analytics

Problems:

- restricted production access;
- oversized source datasets;
- slow provisioning.

Relevant capabilities:

- Subsetter;
- Masking.

## AI Engineering

Problems:

- agents need realistic systems;
- production data cannot be exposed freely;
- isolated execution environments are needed.

Relevant capabilities:

- Subsetter;
- Masking;
- future environment lifecycle.

---

# 21. TARGET INDUSTRIES

Initial sectors with strong potential fit:

## Financial Services

- banks;
- fintechs;
- payments;
- insurance;
- asset management.

Reasons:

- sensitive customer/financial data;
- multiple environments;
- regulatory pressure;
- complex databases;
- strong QA and engineering requirements.

## SaaS / Digital Products

Reasons:

- multiple tenants;
- incident reproduction;
- fast software cycles;
- environment automation.

## Retail / E-commerce

Reasons:

- customer PII;
- order/payment/logistics relationships;
- performance testing;
- complex integration scenarios.

## Manufacturing

Reasons:

- ERP modernization;
- legacy databases;
- integration testing;
- external vendors.

## Telecommunications

Reasons:

- large databases;
- customer PII;
- complex systems;
- frequent engineering changes.

## Healthcare

Potential fit exists, but unstructured clinical data and re-identification risks require additional care. Do not overstate current capabilities for free text, images or complex clinical records.

---

# 22. IDEAL CUSTOMER PROFILE

A strong Tessera prospect often has several of these signals:

- medium or large engineering organization;
- multiple DEV / QA / HML environments;
- PostgreSQL, MySQL, SQL Server, Oracle or MongoDB;
- sensitive / regulated data;
- database migration or cloud modernization;
- large QA organization;
- Platform Engineering;
- Data Platform;
- manual database refreshes;
- production copies outside PROD;
- contractor development;
- long lead time to provision test data;
- shared non-production databases.

Relevant buyer / sponsor roles:

- CTO;
- CIO;
- Head of Engineering;
- Head of Platform Engineering;
- Head of Data;
- Data Platform Manager;
- Database Engineering Manager;
- QA / Quality Engineering Manager;
- CISO;
- DPO;
- Enterprise Architect;
- Solution Architect.

---

# 23. WEBSITE INFORMATION ARCHITECTURE

Recommended initial navigation:

```text
Platform
Use Cases
Architecture
Security
Roadmap
Company
Contact
```

Primary CTA:

> **Request a Demo**

Secondary CTA:

> **Explore the Platform**

---

# 24. HOMEPAGE — HERO

## Eyebrow

**DATA ENVIRONMENT AUTOMATION**

## Primary headline

> **Production-like data. Without production risk.**

## Supporting copy

> Tessera helps engineering and data teams discover sensitive data, protect it with deterministic masking, create referentially consistent subsets and capture ongoing database changes for development, testing, analytics, migration and AI-assisted engineering.

## Primary CTA

**Request a Demo**

## Secondary CTA

**Explore the Platform**

---

# 25. HOMEPAGE — PROBLEM

## Headline

> **Your code moves fast. Your data environments don't.**

## Body

> Modern teams have automated code and infrastructure, but realistic data for development and testing is still frequently delivered through full database copies, manual scripts, shared environments and support tickets.
>
> The result is slower engineering, higher infrastructure cost and unnecessary exposure of sensitive production data.
>
> **Tessera automates the data layer of modern engineering workflows.**

---

# 26. HOMEPAGE — PLATFORM CAPABILITIES

The cards should not imply a required sequence.

## Discovery

### Label
**READY**

### Headline
**Find sensitive data.**

### Copy
Classify sensitive fields from metadata and representative values and produce a reusable inventory for protection workflows.

---

## Masking

### Label
**READY**

### Headline
**Protect without breaking relationships.**

### Copy
Apply deterministic, format-aware transformations so related values remain consistent across tables and repeated executions.

---

## Subsetter

### Label
**READY — CORE COMPLETE**

### Headline
**Move only what you need.**

### Copy
Create smaller datasets while preserving physical and logical relationships across complex schemas.

---

## CDC & Snapshot

### Label
**AVAILABLE — HARDENING**

### Headline
**Capture what changes.**

### Copy
Coordinate consistent snapshots with incremental PostgreSQL and MySQL change streams and write canonical JSONL to S3 or filesystem.

---

## Data Environment Lifecycle

### Label
**ROADMAP**

### Headline
**Environments on demand.**

### Copy
Our roadmap extends Tessera toward automated provisioning, refresh, snapshots and rollback for isolated non-production database environments.

---

# 27. HOMEPAGE — COMPOSABLE ARCHITECTURE

## Headline

> **Use the capabilities you need. Combine them when the workflow demands it.**

## Copy

> Tessera is modular by design. Discovery, Masking, Subsetter and CDC can support different workflows independently or be combined for more advanced data-delivery scenarios.

Suggested visual:

```text
          Discover
             │
             ├────────┐
             │        │
          Protect   Subset
                      │
Capture ──────────────┤
                      │
                 Engineering workflows

No mandatory sequence.
```

Prefer a hub-and-spoke or modular tile visual instead of arrows implying a fixed pipeline.

---

# 28. HOMEPAGE — USE CASE CARDS

## Secure Test Data

> Smaller, protected datasets for DEV, QA and integration testing.

## Data Engineering Sandbox

> Build and validate data pipelines against realistic source structures.

## Incident Reproduction

> Recreate production scenarios safely and consistently.

## Migration & Modernization

> Use repeatable subsets and incremental change capture while platforms evolve.

## Analytics Sandbox

> Give analysts realistic datasets without direct production access.

## AI-Assisted Engineering

> Provide realistic, protected data for AI-assisted development and testing.

---

# 29. HOMEPAGE — DEVELOPER EXPERIENCE

## Headline

> **Built for engineering workflows.**

## Web

Interactive job configuration, connectors, schema graph and job progress.

## REST API

Programmatic platform integration.

## CLI

Headless execution through configuration, suitable for CI/CD and automation.

## Kubernetes

Declarative execution through custom resources and controller-runtime.

---

# 30. HOMEPAGE — ROADMAP

## Headline

> **From secure data delivery to complete data environment lifecycle automation.**

## Body

> Tessera's roadmap extends the current platform toward on-demand non-production database environments backed by safe replicas and cloud-native storage.

## Roadmap capabilities

- provision;
- refresh;
- snapshot;
- rollback.

Use a visible **ROADMAP** label.

---

# 31. HOMEPAGE — FINAL CTA

## Headline

> **Stop waiting for safe, realistic data.**

## Body

> Bring production-like datasets to engineering and data teams without bringing unnecessary production risk with them.

## CTA

**Request a Demo**

---

# 32. PLATFORM PAGE — INTRO COPY

## Headline

> **Composable data capabilities for modern engineering.**

## Body

> Tessera is built as a set of independent and composable data capabilities. Use sensitive-data Discovery, deterministic Masking, referential Subsetting, CDC & Snapshot independently or combine them according to the workflow.

This wording is essential because it avoids presenting a false linear dependency between modules.

---

# 33. SECURITY PAGE — RECOMMENDED CONTENT

## Headline

> **Protect data before it spreads through non-production.**

## Topics

- sensitive-data classification;
- deterministic masking;
- key-driven transformations;
- AWS KMS support;
- Kubernetes Secret / file providers;
- data minimization through subsetting;
- deployment within engineering pipelines.

## Important wording

Avoid certifications or compliance claims unless they have actually been obtained.

Do not claim:

- SOC 2;
- ISO 27001;
- PCI certification;
- LGPD compliance certification;
- GDPR certification;

unless true and documented.

---

# 34. ARCHITECTURE PAGE — TECHNICAL DETAIL

The Architecture page can be more technical than the homepage.

Recommended sections:

1. Modular architecture.
2. Discovery classifier architecture.
3. Masking algorithm registry and CryptoService.
4. Subsetter Schema Graph / Planner / Executor.
5. Tarjan SCC and execution waves.
6. Web / CLI / Kubernetes surfaces.
7. CDC Coordinator / Snapshot / Streamer.
8. Canonical JSONL.
9. Kubernetes custom resources.
10. Roadmap environment lifecycle.

The architecture page is the right location for terms such as:

- FF1;
- SHA-256;
- Neo4j;
- Tarjan SCC;
- MVCC;
- LSN;
- GTID;
- pgoutput;
- controller-runtime;
- SSE.

The homepage should focus primarily on customer problems and outcomes.

---

# 35. FAQ — RECOMMENDED QUESTIONS

## Does CDC require Discovery, Masking or Subsetter?

**No.** CDC & Snapshot is an independent capability. It can run without Discovery, Masking or Subsetter. The modules may be integrated depending on the workflow.

## Can Discovery run independently?

Yes. Discovery is a reusable Go framework that accepts metadata and samples and returns a classification inventory.

## Is Masking tied to Discovery?

No. They are separate frameworks. Discovery can produce an inventory that Masking consumes, but they do not require direct implementation coupling.

## Can Subsetter apply masking while extracting data?

Yes. Subsetter can embed Discovery and Masking during extraction.

## Which databases does Subsetter support?

Current technical support includes PostgreSQL, MySQL, SQL Server, Oracle and MongoDB, plus object-storage workflows.

## Which databases does CDC support?

Current CDC source support is PostgreSQL 16+ and MySQL 8+.

## Where does CDC write data?

Current output is canonical JSONL written to S3 or filesystem.

## Does Tessera replace Kafka?

Not necessarily. Tessera CDC can support use cases that do not require a full streaming stack, but the website should not claim it universally replaces Kafka.

## Does Tessera automatically clone production databases today?

No. Full database environment lifecycle automation is on the roadmap.

## Does Tessera guarantee 100% PII detection?

No. Discovery is designed with a recall-first strategy, but sensitive-data classification still requires appropriate policies, evaluation and review.

## Does Tessera fix poor data quality?

No. Tessera helps teams work with realistic, protected data. It does not automatically remediate incorrect or low-quality source data.

## Is Tessera an AI platform?

No. Tessera provides data capabilities that can support AI-assisted engineering, but it is not an AI-agent, RAG or LLM orchestration platform.

---

# 36. CLAIMS TO AVOID

Never invent or publish claims such as:

- "100% of PII protected."
- "All sensitive data automatically detected."
- "All products production-ready."
- "Clone any database in minutes."
- "Complete database lifecycle available now."
- "Automatic migration to any database."
- "Tessera fixes data quality."
- "Tessera makes any data GDPR/LGPD compliant."
- "Tessera is a full AI context platform."
- "Synthetic data generation" — not currently established.
- "Dynamic masking" — not currently established.
- "DynamoDB support" — currently specified, not implemented.

---

# 37. SAFE MARKETING CLAIMS

Prefer language such as:

- **Automated sensitive-data discovery.**
- **Deterministic masking designed to preserve relationships.**
- **Referentially consistent data subsetting.**
- **Consistent snapshot and incremental change capture.**
- **PostgreSQL and MySQL CDC.**
- **Web, CLI and Kubernetes-friendly workflows.**
- **Designed for development, QA, Data Engineering, analytics, migration and AI-assisted engineering.**
- **Data Environment Lifecycle is on the roadmap.**
- **Production-like data without direct production exposure.**

---

# 38. TONE OF VOICE

The website should feel:

- technical;
- precise;
- enterprise-ready;
- modern;
- confident;
- engineering-oriented;
- low-hype.

Avoid generic consulting language such as:

> "Transform your business with the power of AI and data."

Avoid exaggerated startup language such as:

> "Revolutionize everything."

Prefer:

> "Create smaller, realistic datasets while preserving relationships."

> "Capture incremental database changes without requiring a full streaming stack."

> "Reduce unnecessary production-data exposure in non-production workflows."

---

# 39. VISUAL DIRECTION

## Overall feel

- Enterprise developer infrastructure.
- Clean, dark-or-light technical aesthetic.
- Strong diagrams.
- Product UI / terminal examples.
- Minimal stock photography.
- Avoid generic AI robot imagery.

## Architecture visuals

Use modular diagrams.

Good:

```text
Discovery     Masking     Subsetter     CDC
    \            |            |          /
     \________ composable capabilities _/
```

Bad:

```text
Discovery -> Masking -> Subsetter -> CDC
```

because it incorrectly implies mandatory dependencies.

## Product status labels

Use visually consistent tags:

- **READY**
- **CORE COMPLETE**
- **HARDENING**
- **ROADMAP**

---

# 40. OPTIONAL WEBSITE PRODUCT LABELS

The safest option is to keep the technical module names:

- Discovery
- Masking
- Subsetter
- CDC & Snapshot
- Data Environment Lifecycle

If more marketing-friendly names are desired, treat them as branding proposals rather than current official product names.

Possible mapping:

| Technical Name | Optional Marketing Label |
|---|---|
| Discovery | Tessera Discover |
| Masking | Tessera Protect |
| Subsetter | Tessera Subset |
| CDC & Snapshot | Tessera Capture |
| Data Environment Lifecycle | Tessera Environments |

Do not silently rename technical components without founder approval.

---

# 41. SHORT COMPANY DESCRIPTION

> **Tessera is building a Data Environment Automation platform for engineering and data teams. Its current capabilities include sensitive-data discovery, deterministic masking, referentially consistent subsetting and database snapshot/change capture. These modules can be used independently or combined according to the workflow, supporting development, testing, Data Engineering, analytics, migration and AI-assisted engineering. Tessera's roadmap extends the platform toward automated lifecycle management for isolated non-production database environments.**

---

# 42. 30-SECOND PRODUCT DESCRIPTION

> **Tessera helps teams work with realistic data outside production without relying on unsafe full copies or manually assembled datasets. It can discover sensitive fields, mask them deterministically, create smaller referentially consistent subsets, and capture PostgreSQL/MySQL changes through coordinated snapshots and CDC. The modules are composable, so teams can use only the capabilities they need.**

---

# 43. ONE-SENTENCE DESCRIPTION

> **Tessera automates how realistic, protected data is prepared and delivered for modern engineering workflows.**

---

# 44. TAGLINE OPTIONS

Recommended order:

1. **Production-like data. Without production risk.**
2. **Bring data environments into the automation era.**
3. **Realistic data. Safe by design.**
4. **Stop waiting for test data.**
5. **Automate the data layer of engineering.**

---

# 45. WEBSITE GENERATION PROMPT FOR CLAUDE / AI CODING ASSISTANT

Copy the prompt below together with this document:

---

**PROMPT START**

You are designing and implementing the public website for **Tessera**, an enterprise developer/data infrastructure company.

Use the attached **Tessera Website Source of Truth & Content Brief** as the authoritative source for:

- product capabilities;
- product status;
- architecture;
- terminology;
- product boundaries;
- use cases;
- marketing claims.

## Critical rules

1. Do not invent product capabilities.
2. Do not market roadmap functionality as available today.
3. Do not draw Discovery -> Masking -> Subsetter -> CDC as a mandatory linear pipeline.
4. CDC & Snapshot is an independent capability and can operate without Discovery, Masking or Subsetter.
5. Discovery and Masking are reusable frameworks.
6. Subsetter can integrate Discovery and Masking during extraction.
7. The future Data Environment Lifecycle / Database Operator is explicitly roadmap.
8. Keep AI as a use case, not the primary definition of Tessera.
9. The website should sell customer outcomes first and technical algorithms second.
10. Use enterprise, technically precise language. Avoid hype.

## Product status to preserve exactly

- Discovery — READY
- Masking — READY
- Subsetter — READY / CORE COMPLETE
- CDC & Snapshot — AVAILABLE / HARDENING
- Data Environment Lifecycle — ROADMAP / PLANNED

## Website goal

A technical or executive visitor should understand within ten seconds:

> Tessera helps teams create and deliver realistic, protected data for non-production engineering workflows without requiring direct production access.

## Suggested information architecture

- Home
- Platform
- Use Cases
- Architecture
- Security
- Roadmap
- Company
- Contact

## Primary CTA

**Request a Demo**

## Hero direction

Eyebrow:
**DATA ENVIRONMENT AUTOMATION**

Headline:
**Production-like data. Without production risk.**

Supporting text:
**Tessera helps engineering and data teams discover sensitive data, protect it with deterministic masking, create referentially consistent subsets and capture ongoing database changes for development, testing, analytics, migration and AI-assisted engineering.**

## UX / visual direction

Build a modern enterprise infrastructure website inspired by the clarity and technical credibility of modern cloud/data/developer-tool companies.

Use:

- clean typography;
- strong architecture diagrams;
- modular product cards;
- terminal/configuration examples;
- restrained motion;
- high information density without clutter;
- responsive design;
- clear product status badges.

Avoid:

- generic AI imagery;
- stock-office photographs;
- excessive gradients;
- vague consulting language;
- fake customer logos;
- invented benchmark numbers;
- invented certifications.

## Architecture visualization requirement

Represent the modules as **composable independent capabilities**, not as one linear workflow.

For example:

Data Sources can independently feed:
- Discovery
- Subsetter
- CDC & Snapshot

Discovery can produce an inventory for Masking.
Subsetter may call Discovery and Masking.
CDC can operate independently.

The future lifecycle layer is separate and must be labeled Roadmap.

## Output expected

Create a polished production-quality website structure and copy using the brief as the single source of truth.

Where information is missing — customer logos, founders, pricing, legal entity, certifications, deployment diagrams, benchmark numbers, contact details — insert clearly identified placeholders rather than inventing facts.

**PROMPT END**

---

# 46. FINAL SOURCE-OF-TRUTH CHECKLIST

Before publishing, verify all of the following:

- [ ] CDC is not shown as dependent on Discovery.
- [ ] CDC is not shown as dependent on Masking.
- [ ] CDC is not shown as dependent on Subsetter.
- [ ] Discovery / Masking are described as reusable frameworks.
- [ ] Subsetter is described as a data-producing application that can embed Discovery / Masking.
- [ ] CDC current output is described as JSONL to S3/filesystem.
- [ ] CDC source support is PostgreSQL 16+ and MySQL 8+.
- [ ] Subsetter supported platforms match the current technical material.
- [ ] DynamoDB is not shown as currently supported.
- [ ] Data Environment Lifecycle is clearly labeled roadmap.
- [ ] No universal database applier is claimed.
- [ ] No synthetic-data capability is invented.
- [ ] No dynamic masking capability is invented.
- [ ] No "100% PII" claim is made.
- [ ] No unsupported compliance certification is shown.
- [ ] AI is positioned as a consumer/use case.
- [ ] Homepage focuses on customer pain/outcome before technical internals.
- [ ] Technical terms such as Tarjan SCC, FF1, MVCC and LSN are primarily used on Architecture/Product pages.
- [ ] Missing company/founder/contact/customer information remains placeholder until supplied.

---

# 47. SOURCE BASIS

This brief consolidates the following supplied materials and founder discussions:

- **Tessera - Deck Tecnico**
  - platform module architecture;
  - Discovery;
  - Masking;
  - Subsetter architecture and interfaces;
  - CDC & Snapshot;
  - planned Database Operator.
- **Tessera Pitch - Light**
  - positioning around engineering velocity, AI adoption, data-environment bottlenecks, sensitive-data protection and product roadmap.
- Founder Q&A / discussion supplied in the conversation:
  - Discovery is a portable library with no direct I/O;
  - Masking is currently static rather than dynamic;
  - Discovery / Masking / Subsetter are not mandatory prerequisites for CDC;
  - database lifecycle automation is future work;
  - the platform should support broader engineering/data use cases rather than being positioned only around AI.

This document intentionally separates **current capability**, **hardening work**, and **roadmap** so the public website does not overstate product maturity.
