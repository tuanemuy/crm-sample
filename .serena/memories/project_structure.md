# Project Structure

## Root Directory
```
/
├── src/                    # Source code
├── docs/                   # Documentation
├── tasks/                  # Task management files
├── logs/                   # Development logs
├── .github/               # GitHub configuration
├── .serena/               # Serena AI assistant config
└── [config files]         # Various config files
```

## Source Code Structure (`src/`)

### Backend (`src/core/`)
```
src/core/
├── domain/                 # Domain Layer (Business Logic)
│   └── {domain}/
│       ├── types.ts       # Entities, DTOs, branded types
│       └── ports/         # Port interfaces (repositories, services)
│
├── application/           # Application Layer (Use Cases)
│   ├── context.ts        # Dependency injection context type
│   └── {domain}/
│       └── {useCase}.ts  # Application services
│
└── adapters/             # Adapter Layer (External Services)
    └── drizzlePglite/    # Database implementation
        ├── schema.ts     # Database schema
        ├── client.ts     # Database connection
        ├── migrations/   # Database migrations
        └── *Repository.ts # Repository implementations
```

### Frontend (`src/app/`)
```
src/app/
├── components/           # React Components
│   ├── ui/              # Reusable UI components (shadcn)
│   └── {domain}/        # Domain-specific components
│
├── styles/              # Global styles
│   └── index.css       # Tailwind CSS entry point
│
└── [routes]/           # Next.js App Router pages
```

### Server Actions (`src/actions/`)
```
src/actions/
└── {domain}.ts         # Server actions for each domain
```

### Shared Utilities (`src/lib/`)
```
src/lib/
├── error.ts           # Base error class
├── pagination.ts      # Pagination utilities
└── [other utils]      # Other shared utilities
```

## Documentation (`docs/`)
- `requirements.md` - Project requirements
- `usecases.md` - Use case descriptions
- `backend.md` - Backend architecture examples
- `frontend.md` - Frontend implementation examples
- `daisyui.md` - UI component library docs
- `test.md` - Testing guidelines
- `pages.md` - Page structure documentation

## Configuration Files
- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome linter/formatter config
- `vitest.config.ts` - Test configuration
- `drizzle.config.ts` - Database configuration
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `CLAUDE.md` - AI assistant instructions

## Task Management
- `tasks.db` - SQLite database for tasks
- `tasks/*.md` - Task documentation files

## Current Domains
The application handles these business domains:
- activity, approval, campaign, contact, contactHistory
- customer, dashboard, deal, displaySettings, document
- emailMarketing, integration, lead, notification
- organization, permission, proposal, report
- scoringRule, security, user, dataImportExport