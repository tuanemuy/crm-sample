# Technology Stack

## Runtime & Framework
- **Runtime**: Node.js 22.x
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.x

## Frontend
- **React**: Version 19 (latest)
- **CSS Framework**: Tailwind CSS v4
- **UI Libraries**: 
  - daisyUI 5 (component library)
  - shadcn/ui components
  - Heroicons for icons
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context

## Backend
- **Architecture**: Hexagonal/Clean Architecture
- **Database**: SQLite with PGlite adapter
- **ORM**: Drizzle ORM
- **Validation**: Zod v3 schemas (imported as "zod/v4")
- **Error Handling**: neverthrow for Result types
- **Password Hashing**: bcryptjs
- **UUID Generation**: uuid library

## Development Tools
- **Package Manager**: pnpm
- **Linting & Formatting**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest
- **Build Tool**: Next.js built-in (with Turbopack for dev)
- **Task Management**: tdlite for tracking development tasks
- **Type Checking**: TypeScript compiler (tsc)

## Infrastructure
- **Environment Management**: dotenv
- **Database Migrations**: Drizzle Kit
- **File Storage**: Local filesystem with LocalStorageManager
- **API**: Next.js API routes and Server Actions

## Key Libraries Versions
- next: 15.3.3
- react/react-dom: 19.0.0
- drizzle-orm: 0.44.2
- zod: 3.25.67
- neverthrow: 8.2.0
- vitest: 3.2.4
- @biomejs/biome: 2.2.2