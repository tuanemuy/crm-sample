# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm lint` - Lint code with Biome
- `pnpm lint:fix` - Lint code with Biome and fix issues
- `pnpm format` - Format code with Biome
- `pnpm format:check` - Check code formatting with Biome
- `pnpm typecheck` - Type check code with tsc
- `pnpm test` - Run tests with Vitest

## Task Management

- `pnpm task add <category> <jsonArray>` - Add new tasks to the task list
    - `[{ "customId": "taskId", "name": "Task Name", "description": "Task Description" }]`
- `pnpm task todo <category>` - List all wip tasks in the specified category
- `pnpm task done <category> <taskId>` - Mark a task as done in the specified category
- `pnpm task wip <category> <taskId>` - Mark a task as wip in the specified category

## Code Quality

- Run `pnpm typecheck`, `pnpm run lint:fix` and `pnpm run format` after making changes to ensure code quality and consistency.

## Tech Stack

- **Runtime**: Node.js 22.x
- **Frontend**: Next.js 15 with React 19, Tailwind CSS, daisyUI and React Hook Form
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod 4 schemas（ `import { z } from "zod/v4";` is valid for zod@^3）
- **Error Handling**: neverthrow for Result types

## Error Handling

- All backend functions return `Result<T, E>` or `Promise<Result<T, E>>` types using `neverthrow`
- Each modules has its own error types, e.g. `RepositoryError`, `ApplicationError`. Error types should extend a base `AnyError` class (`src/lib/error.ts`)

## Backend Architecture

Hexagonal architecture with domain-driven design principles:

- **Domain Layer** (`src/core/domain/`): Contains business logic, types, and port interfaces
    - `src/core/domain/${domain}/types.ts`: Domain entities, value objects, and DTOs
    - `src/core/domain/${domain}/ports/**.ts`: Port interfaces for external services (repositories, exteranl APIs, etc.)
- **Adapter Layer** (`src/core/adapters/`): Contains concrete implementations for external services
    - `src/core/adapters/${externalService}/**.ts`: Adapters for external services like databases, APIs, etc.
- **Application Layer** (`src/core/application/`): Contains use cases and application services
    - `src/core/application/context.ts`: Context type for dependency injection
    - `src/core/application/${domain}/${usecase}.ts`: Application services that orchestrate domain logic. Each service is a function that takes a context object.

### Example Implementation

See `docs/backend.md` for detailed examples of types, ports, adapters, application services and context object.

## Frontend Architecture

Next.js 15 application code using:

- App Router
- React 19
- Tailwind CSS v4
- daisyUI 5
- React Hook Form

- UI Components
    - `src/app/components/ui/`: Reusable UI components using shadcn/ui
    - `src/app/components/${domain}/`: Domain-specific components
    - `src/app/components/**/*`: Other reusable components
- Pages and Routes
    - Follows Next.js App Router conventions
- Styles
    - `src/app/styles/index.css`: Entry point for global styles
- Server Actions
    - `src/actions/${domain}.ts`: Server actions for handling application services

### Example Implementation

See `docs/frontend.md` for detailed examples of server actions and client components.

### UI Library

See `docs/daisyui.md` for details on using daisyUI with Tailwind CSS.
