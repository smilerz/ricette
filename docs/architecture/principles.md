# Architecture Principles

This document explains why Ricette's major architectural decisions exist. It is the canonical reference for the application responsibility boundary, the client interaction model, and the invariants that constrain future change.

## Application Responsibility Boundary

Laravel owns:

- domain models
- canonical business rules
- persistence
- migrations
- authentication
- authorization
- validation
- transactions
- background jobs
- imports
- storage abstractions
- server-side search abstractions
- application routing
- entitlement evaluation

Svelte owns:

- all product UI
- transient interaction state
- rich client interaction
- immediate visual state
- component behavior

Inertia connects the two without requiring the web application to become a separate REST application.

## Client Interaction Model

Ricette is explicitly a **client-interactive application**.

The browser owns transient interaction. The server owns durable truth.

Examples of browser-owned behavior:

- ingredient editing
- autocomplete
- tree expansion
- drag and drop
- food reparenting
- list selection
- filtering
- sorting
- recipe scaling presentation
- meal-plan manipulation
- shopping interaction
- inventory batch editing
- optimistic state where appropriate
- drawers, sheets, dialogs, and contextual interactions
- responsive/mobile interaction state

Examples of server-owned behavior:

- permissions
- canonical quantities
- persisted relationships
- household ownership
- entitlement decisions
- validation
- transactions
- durable workflows

Server-side rendering may be used for initial page delivery, public content, SEO, or performance. SSR does **not** change the browser-owned interaction model after hydration.

There is one canonical product frontend architecture: Svelte. No second frontend paradigm should emerge for ordinary application features.

## Core Architectural Invariants

### 7.1 One application core

Community and hosted editions use the same core domain implementation.

### 7.2 SQLite is first-class

Core functionality and migrations must operate on SQLite. PostgreSQL-specific behavior may exist behind explicitly designed abstractions but cannot silently become required.

### 7.3 PostgreSQL is first-class

Hosted behavior must be continuously tested against PostgreSQL.

### 7.4 No unnecessary community dependencies

Accessory infrastructure cannot become required simply because it makes hosted engineering easier.

### 7.5 Svelte owns product UI

Product UI must not fragment into multiple competing interaction frameworks.

### 7.6 Domain logic stays out of the client

Svelte may calculate transient presentation state. Canonical business rules belong in the server/domain layer.

### 7.7 Scale extends rather than replaces

Moving from SQLite to PostgreSQL or from one process to many should not require redesigning core product behavior.

### 7.8 Framework before dependency

Before adding a package:

1. determine whether Laravel/Svelte already provides the capability;
2. evaluate a mature package if not;
3. build custom infrastructure only when justified.
